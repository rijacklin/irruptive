//! Requires PostgreSQL: `#[sqlx::test]` creates an isolated database per test
//! from `DATABASE_URL` and applies the embedded migrations.

use sqlx::PgPool;

#[sqlx::test(migrator = "irruptive_db::MIGRATOR")]
async fn migrations_apply_to_a_fresh_database(pool: PgPool) {
    let (one,): (i32,) = sqlx::query_as("SELECT 1").fetch_one(&pool).await.unwrap();
    assert_eq!(one, 1);
}
