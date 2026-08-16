import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createTestApp } from "../test/create-test-app.js";

const workOrderId = "6efd02fb-37ae-4685-b0c8-d7408afbf3b3";

describe("GET /api/work-orders/:id/activity", () => {
  it("returns a serialized activity timeline", async () => {
    const { app, store, commentStore, eventStore } = createTestApp();
    vi.mocked(store.findById).mockResolvedValue({
      id: workOrderId,
      title: "Inspect conveyor",
      description: "Inspect the conveyor drive assembly.",
      status: "open",
      priority: "medium",
      category: null,
      createdBy: "234173b3-13a5-43c8-baf7-bf06640cf7fd",
      assignedTo: null,
      createdAt: new Date("2026-08-16T12:00:00.000Z"),
      updatedAt: new Date("2026-08-16T12:00:00.000Z"),
    });
    vi.mocked(eventStore.listByWorkOrderId).mockResolvedValue([
      {
        id: "10000000-0000-4000-8000-000000000000",
        workOrderId,
        eventType: "work_order_created",
        eventData: { status: "open" },
        createdAt: new Date("2026-08-16T12:00:00.000Z"),
      },
    ]);
    vi.mocked(commentStore.listByWorkOrderId).mockResolvedValue([
      {
        id: "20000000-0000-4000-8000-000000000000",
        workOrderId,
        userId: "234173b3-13a5-43c8-baf7-bf06640cf7fd",
        body: "Inspection has started.",
        createdAt: new Date("2026-08-16T12:05:00.000Z"),
      },
    ]);

    const response = await request(app).get(
      `/api/work-orders/${workOrderId}/activity`,
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      {
        kind: "event",
        id: "10000000-0000-4000-8000-000000000000",
        eventType: "work_order_created",
        eventData: { status: "open" },
        createdAt: "2026-08-16T12:00:00.000Z",
      },
      {
        kind: "comment",
        id: "20000000-0000-4000-8000-000000000000",
        userId: "234173b3-13a5-43c8-baf7-bf06640cf7fd",
        body: "Inspection has started.",
        createdAt: "2026-08-16T12:05:00.000Z",
      },
    ]);
  });

  it("returns 404 for a missing work order", async () => {
    const { app, store } = createTestApp();
    vi.mocked(store.findById).mockResolvedValue(null);

    const response = await request(app).get(
      `/api/work-orders/${workOrderId}/activity`,
    );

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("WORK_ORDER_NOT_FOUND");
  });
});
