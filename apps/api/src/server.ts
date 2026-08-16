import { config as loadDotenv } from "dotenv";
import {
  checkDatabaseConnection,
  CommentRepository,
  createDatabasePool,
  WorkOrderEventRepository,
  WorkOrderRepository,
} from "@irruptive/database";
import { createApp } from "./app.js";
import { loadEnvironment } from "./config.js";
import { WorkOrderService } from "./services/work-order-service.js";
import { CommentService } from "./services/comment-service.js";
import { WorkOrderActivityService } from "./services/work-order-activity-service.js";

loadDotenv({
  // fix to resolve .env in root dir
  path: new URL("../../../.env", import.meta.url),
  quiet: true,
});

const environment = loadEnvironment();

const pool = createDatabasePool({ connectionString: environment.DATABASE_URL });
await checkDatabaseConnection(pool);
console.log("Database connection established");

const workOrderRepository = new WorkOrderRepository(pool);
const commentRepository = new CommentRepository(pool);
const workOrderEventRepository = new WorkOrderEventRepository(pool);
const workOrderService = new WorkOrderService(workOrderRepository);
const commentService = new CommentService(
  commentRepository,
  workOrderRepository,
);
const workOrderActivityService = new WorkOrderActivityService(
  workOrderRepository,
  commentRepository,
  workOrderEventRepository,
);
const app = createApp({
  workOrderService,
  commentService,
  workOrderActivityService,
});

const server = app.listen(environment.API_PORT, environment.API_HOST, () => {
  console.log(
    `API listening on http://${environment.API_HOST}:${environment.API_PORT}`,
  );
});

async function shutdown(signal: string): Promise<void> {
  console.log(`Received ${signal}; shutting down`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

// server can listen to OS signals to properly shutdowwn
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
