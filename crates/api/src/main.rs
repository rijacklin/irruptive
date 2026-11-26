use anyhow::Context;
use irruptive_api::config::Config;
use irruptive_api::{AppState, router};
use tokio::net::TcpListener;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // A missing .env is normal outside local development.
    dotenvy::dotenv().ok();
    init_tracing();

    let config = Config::from_env().context("invalid configuration")?;
    let db = irruptive_db::connect(&config.database_url)
        .await
        .context("failed to connect to PostgreSQL")?;

    let listener = TcpListener::bind(config.listen_addr)
        .await
        .with_context(|| format!("failed to bind {}", config.listen_addr))?;
    tracing::info!(addr = %config.listen_addr, "irruptive-api listening");

    axum::serve(listener, router(AppState { db }))
        .with_graceful_shutdown(shutdown_signal())
        .await
        .context("server error")
}

/// `RUST_LOG` controls verbosity; `LOG_FORMAT=json` switches to structured output.
fn init_tracing() {
    let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));
    let builder = tracing_subscriber::fmt().with_env_filter(filter);
    if std::env::var("LOG_FORMAT").is_ok_and(|format| format == "json") {
        builder.json().init();
    } else {
        builder.init();
    }
}

/// Resolves on Ctrl-C or, on Unix, SIGTERM (what ECS and Docker send).
async fn shutdown_signal() {
    let ctrl_c = async {
        if let Err(error) = tokio::signal::ctrl_c().await {
            tracing::error!(%error, "failed to listen for Ctrl-C");
        }
    };

    #[cfg(unix)]
    let terminate = async {
        match tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate()) {
            Ok(mut signal) => {
                signal.recv().await;
            }
            Err(error) => tracing::error!(%error, "failed to listen for SIGTERM"),
        }
    };
    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        () = ctrl_c => {},
        () = terminate => {},
    }
    tracing::info!("shutdown signal received");
}
