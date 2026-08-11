import cors from "cors";
import express from "express";
import type { HealthResponse } from "@irruptive/shared";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_request, response) => {
    const body: HealthResponse = { status: "ok" };
    response.json(body);
  });

  return app;
}
