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

  it("remains public when application APIs require authentication", async () => {
    const { app } = createTestApp(null);

    const healthResponse = await request(app).get("/health");
    const apiResponse = await request(app).get("/api/work-orders");

    expect(healthResponse.status).toBe(200);
    expect(apiResponse.status).toBe(401);
    expect(apiResponse.body).toEqual({
      error: {
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication is required.",
      },
    });
  });
});
