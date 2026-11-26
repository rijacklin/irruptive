use axum::Json;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct HealthResponse {
    status: &'static str,
}

/// Liveness probe. Deliberately does not touch the database.
pub async fn health() -> Json<HealthResponse> {
    Json(HealthResponse { status: "ok" })
}
