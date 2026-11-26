//! Server configuration, read once from the environment at startup.

use std::net::{IpAddr, Ipv4Addr, SocketAddr};

#[derive(Clone, Debug)]
pub struct Config {
    pub listen_addr: SocketAddr,
    pub database_url: String,
}

#[derive(Debug, thiserror::Error, PartialEq, Eq)]
pub enum ConfigError {
    #[error("{0} is required")]
    Missing(&'static str),

    #[error("{name} is invalid: {value:?}")]
    Invalid { name: &'static str, value: String },
}

impl Config {
    /// Reads configuration from the process environment.
    ///
    /// # Errors
    ///
    /// Returns the first missing or malformed variable.
    pub fn from_env() -> Result<Self, ConfigError> {
        Self::from_lookup(|name| std::env::var(name).ok())
    }

    /// Reads configuration through `lookup`, so tests need not mutate the
    /// process environment. Empty values are treated as unset.
    ///
    /// # Errors
    ///
    /// Returns the first missing or malformed variable.
    pub fn from_lookup(lookup: impl Fn(&str) -> Option<String>) -> Result<Self, ConfigError> {
        let get = |name: &str| lookup(name).filter(|value| !value.trim().is_empty());

        let host = parse_or(
            get("API_HOST"),
            "API_HOST",
            IpAddr::V4(Ipv4Addr::UNSPECIFIED),
        )?;
        let port = parse_or(get("API_PORT"), "API_PORT", 3000_u16)?;
        let database_url = get("DATABASE_URL").ok_or(ConfigError::Missing("DATABASE_URL"))?;

        Ok(Self {
            listen_addr: SocketAddr::new(host, port),
            database_url,
        })
    }
}

fn parse_or<T: std::str::FromStr>(
    value: Option<String>,
    name: &'static str,
    default: T,
) -> Result<T, ConfigError> {
    value.map_or(Ok(default), |value| {
        value
            .parse()
            .map_err(|_| ConfigError::Invalid { name, value })
    })
}

#[cfg(test)]
mod tests {
    use std::collections::HashMap;

    use super::*;

    fn load(vars: &[(&str, &str)]) -> Result<Config, ConfigError> {
        let vars: HashMap<String, String> = vars
            .iter()
            .map(|(k, v)| ((*k).to_owned(), (*v).to_owned()))
            .collect();
        Config::from_lookup(|name| vars.get(name).cloned())
    }

    #[test]
    fn applies_defaults_when_only_database_url_is_set() {
        let config = load(&[("DATABASE_URL", "postgres://localhost/irruptive")]).unwrap();
        assert_eq!(config.listen_addr, "0.0.0.0:3000".parse().unwrap());
        assert_eq!(config.database_url, "postgres://localhost/irruptive");
    }

    #[test]
    fn requires_database_url() {
        assert_eq!(
            load(&[("DATABASE_URL", "  ")]).unwrap_err(),
            ConfigError::Missing("DATABASE_URL")
        );
    }

    #[test]
    fn rejects_an_invalid_port() {
        let error = load(&[("DATABASE_URL", "postgres://x"), ("API_PORT", "70000")]).unwrap_err();
        assert_eq!(
            error,
            ConfigError::Invalid {
                name: "API_PORT",
                value: "70000".to_owned()
            }
        );
    }
}
