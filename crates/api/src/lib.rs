//! Irruptive REST API: router, handlers, extractors, and HTTP error mapping.

pub mod config;
pub mod error;
mod health;

use axum::Router;
use axum::routing::get;
use sqlx::PgPool;
use tower_http::trace::TraceLayer;

use crate::error::AppError;

/// Shared state handed to every handler. Cheap to clone: each field is a handle.
#[derive(Clone, Debug)]
pub struct AppState {
    pub db: PgPool,
}

/// Builds the application router. `main` and tests both start from here.
pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/health", get(health::health))
        .fallback(|| async { AppError::NotFound })
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}

#[cfg(test)]
mod tests {
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use http_body_util::BodyExt;
    use serde_json::{Value, json};
    use sqlx::postgres::PgPoolOptions;
    use tower::ServiceExt;

    use super::*;

    /// A pool that never connects; fine for routes that do not touch the database.
    fn test_state() -> AppState {
        let db = PgPoolOptions::new()
            .connect_lazy("postgres://unused@localhost/unused")
            .unwrap();
        AppState { db }
    }

    async fn get_json(uri: &str) -> (StatusCode, Value) {
        let response = router(test_state())
            .oneshot(Request::get(uri).body(Body::empty()).unwrap())
            .await
            .unwrap();
        let status = response.status();
        let bytes = response.into_body().collect().await.unwrap().to_bytes();
        (status, serde_json::from_slice(&bytes).unwrap())
    }

    #[tokio::test]
    async fn health_reports_ok() {
        let (status, body) = get_json("/health").await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(body, json!({ "status": "ok" }));
    }

    #[tokio::test]
    async fn unknown_route_returns_not_found_error_shape() {
        let (status, body) = get_json("/api/does-not-exist").await;
        assert_eq!(status, StatusCode::NOT_FOUND);
        assert_eq!(
            body,
            json!({
                "error": {
                    "code": "NOT_FOUND",
                    "message": "The requested resource does not exist."
                }
            })
        );
    }
}
