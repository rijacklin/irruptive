import { config as loadDotenv } from "dotenv";
import {
  checkDatabaseConnection,
  createDatabasePool,
  WorkOrderRepository,
} from "@irruptive/database";
import { createApp } from "../app.js";
import { WorkOrderService } from "../services/work-order-service.js";

loadDotenv({
  path: new URL("../../../../.env", import.meta.url),
  quiet: true,
});

export async function createIntegrationTestApp() {
  const connectionString = process.env.TEST_DATABASE_URL;

  if (!connectionString) {
    throw new Error("TEST_DATABASE_URL is required for API integration tests");
  }

  if (connectionString === process.env.DATABASE_URL) {
    throw new Error(
      "TEST_DATABASE_URL must reference a database separate from DATABASE_URL",
    );
  }

  const pool = createDatabasePool({ connectionString });

  try {
    await checkDatabaseConnection(pool);
  } catch (error) {
    await pool.end();
    throw error;
  }

  const repository = new WorkOrderRepository(pool);
  const service = new WorkOrderService(repository);
  const app = createApp({ workOrderService: service });

  return { app, pool };
}
