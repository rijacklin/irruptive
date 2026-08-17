import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import type { WorkOrder } from "@irruptive/database";
import { createTestApp } from "../test/create-test-app.js";

const workOrder: WorkOrder = {
  id: "6efd02fb-37ae-4685-b0c8-d7408afbf3b3",
  title: "Conveyor intermittently stopping",
  description: "Operator reports grinding before shutdown.",
  status: "open",
  priority: "high",
  category: "Mechanical",
  createdBy: "234173b3-13a5-43c8-baf7-bf06640cf7fd",
  assignedTo: null,
  createdAt: new Date("2026-08-13T12:00:00.000Z"),
  updatedAt: new Date("2026-08-13T12:00:00.000Z"),
};
describe("AI analysis routes", () => {
  it("returns an explicit null empty state", async () => {
    const { app, store, analysisStore } = createTestApp();
    vi.mocked(store.findById).mockResolvedValue(workOrder);
    vi.mocked(analysisStore.findLatestByWorkOrderId).mockResolvedValue(null);

    const response = await request(app).get(
      `/api/work-orders/${workOrder.id}/ai-analysis`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: null });
  });

  it("enforces the stricter request policy", async () => {
    const { app, store, analysisStore } = createTestApp({
      id: workOrder.createdBy,
      role: "requester",
    });
    vi.mocked(store.findById).mockResolvedValue(workOrder);

    const response = await request(app).post(
      `/api/work-orders/${workOrder.id}/ai-analysis`,
    );

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("AUTHORIZATION_DENIED");
    expect(analysisStore.create).not.toHaveBeenCalled();
  });
});
