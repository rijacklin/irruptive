//! PostgreSQL access for Irruptive.
//!
//! Owns the connection pool, the embedded migration set, and all SQL. Query
//! functions accept any [`sqlx::PgExecutor`] so callers can run them on the pool
//! or inside a transaction.

use std::time::Duration;

use sqlx::migrate::Migrator;
use sqlx::postgres::{PgPool, PgPoolOptions};

/// Migrations embedded from `crates/db/migrations` at compile time.
pub static MIGRATOR: Migrator = sqlx::migrate!("./migrations");

/// Opens a connection pool, failing fast if the database is unreachable.
///
/// # Errors
///
/// Returns an error when the URL is invalid or no connection can be
/// established within the acquire timeout.
pub async fn connect(database_url: &str) -> Result<PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(10)
        .acquire_timeout(Duration::from_secs(5))
        .connect(database_url)
        .await
}
