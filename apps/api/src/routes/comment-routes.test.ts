import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Comment, WorkOrder } from "@irruptive/database";
import { createTestApp } from "../test/create-test-app.js";

const workOrderId = "6efd02fb-37ae-4685-b0c8-d7408afbf3b3";
const userId = "234173b3-13a5-43c8-baf7-bf06640cf7fd";

const workOrder: WorkOrder = {
  id: workOrderId,
  title: "Conveyor intermittently stopping",
  description: "Operator reports grinding before shutdown.",
  status: "open",
  priority: "high",
  category: "Mechanical",
  createdBy: userId,
  assignedTo: null,
  createdAt: new Date("2026-08-13T12:00:00.000Z"),
  updatedAt: new Date("2026-08-13T12:00:00.000Z"),
};

const comment: Comment = {
  id: "8e33a153-d529-4e22-829e-e83d4f313d38",
  workOrderId,
  userId,
  body: "The drive bearing is visibly worn.",
  createdAt: new Date("2026-08-13T12:05:00.000Z"),
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/work-orders/:id/comments", () => {
  it("creates a comment with a normalized body", async () => {
    const { app, store, commentStore } = createTestApp();
    vi.mocked(store.findById).mockResolvedValue(workOrder);
    vi.mocked(commentStore.create).mockResolvedValue(comment);

    const response = await request(app)
      .post(`/api/work-orders/${workOrderId}/comments`)
      .send({
        body: `  ${comment.body}  `,
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      data: {
        ...comment,
        createdAt: "2026-08-13T12:05:00.000Z",
      },
    });
    expect(commentStore.create).toHaveBeenCalledWith({
      workOrderId,
      userId,
      body: comment.body,
    });
  });

  it.each([
    {
      name: "a malformed work-order id",
      id: "not-a-uuid",
      body: { body: "Valid body" },
    },
    {
      name: "a spoofed user id",
      id: workOrderId,
      body: { userId, body: "Valid body" },
    },
    { name: "a blank body", id: workOrderId, body: { body: "   " } },
    {
      name: "an unknown property",
      id: workOrderId,
      body: { body: "Valid body", workOrderId },
    },
  ])("rejects $name", async ({ id, body }) => {
    const { app, store, commentStore } = createTestApp();

    const response = await request(app)
      .post(`/api/work-orders/${id}/comments`)
      .send(body);

    expect(response.status).toBe(400);
    expect(store.findById).not.toHaveBeenCalled();
    expect(commentStore.create).not.toHaveBeenCalled();
  });

  it("returns 404 when the work order does not exist", async () => {
    const { app, store, commentStore } = createTestApp();
    vi.mocked(store.findById).mockResolvedValue(null);

    const response = await request(app)
      .post(`/api/work-orders/${workOrderId}/comments`)
      .send({ body: comment.body });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("WORK_ORDER_NOT_FOUND");
    expect(commentStore.create).not.toHaveBeenCalled();
  });
});

describe("GET /api/work-orders/:id/comments", () => {
  it("lists serialized comments", async () => {
    const { app, store, commentStore } = createTestApp();
    vi.mocked(store.findById).mockResolvedValue(workOrder);
    vi.mocked(commentStore.listByWorkOrderId).mockResolvedValue([comment]);

    const response = await request(app).get(
      `/api/work-orders/${workOrderId}/comments`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [
        {
          ...comment,
          createdAt: "2026-08-13T12:05:00.000Z",
        },
      ],
    });
    expect(commentStore.listByWorkOrderId).toHaveBeenCalledWith(workOrderId);
  });

  it("returns 404 when the work order does not exist", async () => {
    const { app, store, commentStore } = createTestApp();
    vi.mocked(store.findById).mockResolvedValue(null);

    const response = await request(app).get(
      `/api/work-orders/${workOrderId}/comments`,
    );

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("WORK_ORDER_NOT_FOUND");
    expect(commentStore.listByWorkOrderId).not.toHaveBeenCalled();
  });
});
