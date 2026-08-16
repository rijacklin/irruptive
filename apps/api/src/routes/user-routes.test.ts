import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createTestApp } from "../test/create-test-app.js";

describe("GET /api/users", () => {
  it("lists users filtered by role", async () => {
    const { app, userStore } = createTestApp();
    vi.mocked(userStore.list).mockResolvedValue([
      {
        id: "98bbd3ae-d7ab-46f4-b348-9f51b65fbadc",
        name: "Alex Technician",
        email: "alex@example.com",
        role: "technician",
        createdAt: new Date("2026-08-16T12:00:00.000Z"),
      },
    ]);

    const response = await request(app).get("/api/users?role=technician");

    expect(response.status).toBe(200);
    expect(userStore.list).toHaveBeenCalledWith({ role: "technician" });
    expect(response.body.data).toEqual([
      {
        id: "98bbd3ae-d7ab-46f4-b348-9f51b65fbadc",
        name: "Alex Technician",
        email: "alex@example.com",
        role: "technician",
        createdAt: "2026-08-16T12:00:00.000Z",
      },
    ]);
  });

  it("rejects an invalid role", async () => {
    const { app, userStore } = createTestApp();

    const response = await request(app).get("/api/users?role=operator");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(userStore.list).not.toHaveBeenCalled();
  });

  it("rejects user-directory access for requesters", async () => {
    const { app, userStore } = createTestApp({
      id: "234173b3-13a5-43c8-baf7-bf06640cf7fd",
      role: "requester",
    });

    const response = await request(app).get("/api/users?role=technician");

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("AUTHORIZATION_DENIED");
    expect(userStore.list).not.toHaveBeenCalled();
  });
});
