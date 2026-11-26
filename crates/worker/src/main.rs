//! Background job worker. No job handlers exist yet; jobs will come from a
//! Postgres-backed queue (`FOR UPDATE SKIP LOCKED`) behind a `JobQueue` trait.

use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));
    tracing_subscriber::fmt().with_env_filter(filter).init();

    tracing::info!("irruptive-worker started; no job handlers are registered yet");
    Ok(())
}
