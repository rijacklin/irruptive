//! The single error type handlers return, and its mapping to HTTP responses.
//!
//! Every error response has the shape
//! `{ "error": { "code": "SCREAMING_SNAKE", "message": "..." } }`.
//! Internal failures are logged with their cause and returned with a generic
//! message so implementation details never reach clients.

use axum::Json;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("The requested resource does not exist.")]
    NotFound,

    #[error("A database error occurred.")]
    Database(#[from] sqlx::Error),
}

impl AppError {
    fn status(&self) -> StatusCode {
        match self {
            Self::NotFound => StatusCode::NOT_FOUND,
            Self::Database(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    fn code(&self) -> &'static str {
        match self {
            Self::NotFound => "NOT_FOUND",
            Self::Database(_) => "DATABASE_ERROR",
        }
    }
}

#[derive(Serialize)]
struct ErrorBody {
    error: ErrorDetail,
}

#[derive(Serialize)]
struct ErrorDetail {
    code: &'static str,
    message: String,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let status = self.status();
        if status.is_server_error() {
            tracing::error!(error = ?self, code = self.code(), "request failed");
        }
        let body = ErrorBody {
            error: ErrorDetail {
                code: self.code(),
                message: self.to_string(),
            },
        };
        (status, Json(body)).into_response()
    }
}
