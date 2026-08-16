import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { config } from "dotenv";
import { Pool } from "pg";

config({
  path: new URL("../../../.env", import.meta.url),
  quiet: true,
});

const connectionString = process.env.TEST_DATABASE_URL;

if (!connectionString) {
  throw new Error("TEST_DATABASE_URL is required for database tests");
}

const pool = new Pool({ connectionString });

describe("database migrations", () => {
  beforeAll(async () => {
    await pool.query("select 1");
  });

  afterAll(async () => {
    await pool.end();
  });

  it("creates the application tables", async () => {
    const result = await pool.query<{ table_name: string }>(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'auth_accounts',
          'auth_sessions',
          'auth_verifications',
          'comments',
          'users',
          'work_orders'
        )
      ORDER BY table_name
    `);

    expect(result.rows.map((row) => row.table_name)).toEqual([
      "auth_accounts",
      "auth_sessions",
      "auth_verifications",
      "comments",
      "users",
      "work_orders",
    ]);
  });
});
