import cors from "cors";
import express from "express";
import type { RequestHandler } from "express";
import type { HealthResponse } from "@irruptive/shared";
import type { WorkOrderService } from "./services/work-order-service.js";
import type { CommentService } from "./services/comment-service.js";
import type { UserService } from "./services/user-service.js";
import { createCommentRouter } from "./routes/comment-routes.js";
import { createWorkOrderRouter } from "./routes/work-order-routes.js";
import { createUserRouter } from "./routes/user-routes.js";
import type { WorkOrderActivityService } from "./services/work-order-activity-service.js";
import { createWorkOrderActivityRouter } from "./routes/work-order-activity-routes.js";
import { notFoundHandler } from "./middleware/not-found-handler.js";
import { errorHandler } from "./middleware/error-handler.js";
import type { AIAnalysisService } from "./services/ai-analysis-service.js";
import { createAIAnalysisRouter } from "./routes/ai-analysis-routes.js";
import {
  requireAuthentication,
  type SessionResolver,
} from "./middleware/require-authentication.js";

export interface AppDependencies {
  workOrderService: WorkOrderService;
  commentService: CommentService;
  userService: UserService;
  authHandler: RequestHandler;
  resolveSession: SessionResolver;
  webOrigin: string;
  workOrderActivityService: WorkOrderActivityService;
  aiAnalysisService: AIAnalysisService;
}

export function createApp(dependencies: AppDependencies) {
  const app = express();

  app.disable("x-powered-by");
  app.use(
    cors({
      origin: dependencies.webOrigin,
      credentials: true,
    }),
  );

  /** catch-all for mounting Better Auth router handler with Express 5. */
  app.all("/api/auth/*splat", dependencies.authHandler);
  app.use(express.json());

  /** liveness probe for application's web api. */
  app.get("/health", (_request, response) => {
    const body: HealthResponse = { status: "ok" };
    response.json(body);
  });

  /** beginning of api requiring authenticated session. */
  app.use("/api", requireAuthentication(dependencies.resolveSession));

  app.use(
    "/api/work-orders",
    createWorkOrderRouter(dependencies.workOrderService),
  );
  app.use(
    "/api/work-orders",
    createAIAnalysisRouter(dependencies.aiAnalysisService),
  );
  app.use("/api/work-orders", createCommentRouter(dependencies.commentService));
  app.use("/api/users", createUserRouter(dependencies.userService));
  app.use(
    "/api/work-orders",
    createWorkOrderActivityRouter(dependencies.workOrderActivityService),
  );

  /** middleware for handling 404 and api errors */
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
