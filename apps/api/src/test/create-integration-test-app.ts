import { config as loadDotenv } from "dotenv";
import { toNodeHandler } from "better-auth/node";
import {
  checkDatabaseConnection,
  CommentRepository,
  createDatabasePool,
  UserRepository,
  WorkOrderRepository,
} from "@irruptive/database";
import { createApp } from "../app.js";
import { WorkOrderService } from "../services/work-order-service.js";
import { CommentService } from "../services/comment-service.js";
import { UserService } from "../services/user-service.js";
import { createAuth } from "../auth.js";

loadDotenv({
  path: new URL("../../../../.env", import.meta.url),
  quiet: true,
});

export async function createIntegrationTestApp(
  options: { allowSignUp?: boolean } = {},
) {
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

  const workOrderRepository = new WorkOrderRepository(pool);
  const commentRepository = new CommentRepository(pool);
  const userRepository = new UserRepository(pool);
  const workOrderService = new WorkOrderService(
    workOrderRepository,
    userRepository,
  );
  const commentService = new CommentService(
    commentRepository,
    workOrderRepository,
  );
  const userService = new UserService(userRepository);
  const auth = createAuth(pool, {
    baseUrl: "http://localhost:3000",
    secret: "test-secret-with-at-least-thirty-two-characters",
    trustedOrigins: ["http://localhost:5173"],
    allowSignUp: options.allowSignUp ?? true,
  });
  const app = createApp({
    workOrderService,
    commentService,
    userService,
    authHandler: toNodeHandler(auth),
    webOrigin: "http://localhost:5173",
  });

  return { app, pool, auth };
}
