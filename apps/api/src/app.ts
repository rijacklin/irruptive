import cors from "cors";
import express from "express";
import type { HealthResponse } from "@irruptive/shared";
import type { WorkOrderService } from "./services/work-order-service.js";
import type { CommentService } from "./services/comment-service.js";
import { createCommentRouter } from "./routes/comment-routes.js";
import { createWorkOrderRouter } from "./routes/work-order-routes.js";
import { notFoundHandler } from "./middleware/not-found-handler.js";
import { errorHandler } from "./middleware/error-handler.js";

export interface AppDependencies {
  workOrderService: WorkOrderService;
  commentService: CommentService;
}

export function createApp(dependencies: AppDependencies) {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_request, response) => {
    const body: HealthResponse = { status: "ok" };
    response.json(body);
  });

  app.use(
    "/api/work-orders",
    createWorkOrderRouter(dependencies.workOrderService),
  );
  app.use("/api/work-orders", createCommentRouter(dependencies.commentService));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
