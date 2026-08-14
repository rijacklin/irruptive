import request from "supertest";
import { describe, expect, it } from "vitest";
import { createTestApp } from "./test/create-test-app.js";

describe("GET /health", () => {
  it("reports that the API is healthy", async () => {
    const { app } = createTestApp();

    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});
