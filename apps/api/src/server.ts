import { toNodeHandler } from "better-auth/node";
import {
  checkDatabaseConnection,
  CommentRepository,
  createDatabasePool,
  UserRepository,
  WorkOrderEventRepository,
  WorkOrderRepository,
  AIAnalysisRepository,
} from "@irruptive/database";
import { createApp } from "./app.js";
import { loadEnvironment } from "./config.js";
import { WorkOrderService } from "./services/work-order-service.js";
import { CommentService } from "./services/comment-service.js";
import { UserService } from "./services/user-service.js";
import { createAuth } from "./auth.js";
import { WorkOrderActivityService } from "./services/work-order-activity-service.js";
import { AIAnalysisService } from "./services/ai-analysis-service.js";
import { OpenAIProvider } from "./ai/openai-provider.js";

try {
  /** grab the .env file from project root (node makes this task ugly, unfortunately)  */
  const repoRootPath = new URL("../../../", import.meta.url);
  process.loadEnvFile(new URL(".env", repoRootPath));
} catch (error) {
  if (
    !(error instanceof Error) ||
    !("code" in error) ||
    error.code !== "ENOENT"
  ) {
    throw error;
  }
}

const environment = loadEnvironment();
const pool = createDatabasePool({ connectionString: environment.DATABASE_URL });
await checkDatabaseConnection(pool);
console.log("Database connection established");

const auth = createAuth(pool, {
  baseUrl: environment.BETTER_AUTH_URL,
  secret: environment.BETTER_AUTH_SECRET,
  trustedOrigins: [environment.WEB_ORIGIN],
});
const workOrderRepository = new WorkOrderRepository(pool);
const commentRepository = new CommentRepository(pool);
const userRepository = new UserRepository(pool);
const workOrderEventRepository = new WorkOrderEventRepository(pool);
const aiAnalysisRepository = new AIAnalysisRepository(pool);
const workOrderService = new WorkOrderService(
  workOrderRepository,
  userRepository,
);
const commentService = new CommentService(
  commentRepository,
  workOrderRepository,
);
const userService = new UserService(userRepository);
const workOrderActivityService = new WorkOrderActivityService(
  workOrderRepository,
  commentRepository,
  workOrderEventRepository,
);
const aiProvider =
  environment.AI_PROVIDER === "openai"
    ? new OpenAIProvider({
        apiKey: environment.AI_API_KEY!,
        model: environment.AI_MODEL!,
        timeoutMs: environment.AI_TIMEOUT_MS,
      })
    : null;
const aiAnalysisService = new AIAnalysisService(
  workOrderRepository,
  aiAnalysisRepository,
  aiProvider,
);
const app = createApp({
  workOrderService,
  commentService,
  userService,
  workOrderActivityService,
  aiAnalysisService,
  authHandler: toNodeHandler(auth),
  resolveSession: (headers) => auth.api.getSession({ headers }),
  webOrigin: environment.WEB_ORIGIN,
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

/** server can listen to OS signals to properly shutdowwn */
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
