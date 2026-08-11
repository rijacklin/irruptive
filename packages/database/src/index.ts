import { Pool, type PoolConfig } from "pg";

export function createDatabasePool(config: PoolConfig): Pool {
  return new Pool(config);
}

export async function checkDatabaseConnection(pool: Pool): Promise<void> {
  await pool.query("select 1");
}

export type { Pool } from "pg";
