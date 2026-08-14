import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { WorkOrder } from "@irruptive/database";
import { createTestApp } from "../test/create-test-app.js";

const workOrderId = "6efd02fb-37ae-4685-b0c8-d7408afbf3b3";
const createdBy = "234173b3-13a5-43c8-baf7-bf06640cf7fd";

const workOrder: WorkOrder = {
  id: workOrderId,
  title: "Conveyor intermittently stopping",
  description: "Operator reports grinding before shutdown.",
  status: "open",
  priority: "high",
  category: "Mechanical",
  createdBy,
  assignedTo: null,
  createdAt: new Date("2026-08-13T12:00:00.000Z"),
  updatedAt: new Date("2026-08-13T12:00:00.000Z"),
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/work-orders", () => {
  it("creates a work order", async () => {
    const { app, store } = createTestApp();
    vi.mocked(store.create).mockResolvedValue(workOrder);

    const response = await request(app).post("/api/work-orders").send({
      title: workOrder.title,
      description: workOrder.description,
      priority: workOrder.priority,
      category: workOrder.category,
      createdBy,
    });

    expect(response.status).toBe(201);

    expect(response.body).toEqual({
      data: {
        ...workOrder,
        createdAt: "2026-08-13T12:00:00.000Z",
        updatedAt: "2026-08-13T12:00:00.000Z",
      },
    });

    expect(store.create).toHaveBeenCalledWith({
      title: workOrder.title,
      description: workOrder.description,
      priority: "high",
      category: "Mechanical",
      createdBy,
    });
  });

  it("rejects an invalid body before calling the store", async () => {
    const { app, store } = createTestApp();

    const response = await request(app).post("/api/work-orders").send({
      title: "x",
      description: "short",
      createdBy: "not-a-uuid",
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        message: "The request is invalid.",
      },
    });

    expect(store.create).not.toHaveBeenCalled();
  });

  it("rejects unknown request properties", async () => {
    const { app, store } = createTestApp();

    const response = await request(app).post("/api/work-orders").send({
      title: workOrder.title,
      description: workOrder.description,
      createdBy,
      status: "closed",
    });

    expect(response.status).toBe(400);
    expect(store.create).not.toHaveBeenCalled();
  });
});

describe("GET /api/work-orders/:id", () => {
  it("returns an existing work order", async () => {
    const { app, store } = createTestApp();
    vi.mocked(store.findById).mockResolvedValue(workOrder);

    const response = await request(app).get(`/api/work-orders/${workOrderId}`);

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(workOrderId);
    expect(store.findById).toHaveBeenCalledWith(workOrderId);
  });

  it("rejects a malformed work-order id", async () => {
    const { app, store } = createTestApp();

    const response = await request(app).get("/api/work-orders/not-a-uuid");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(store.findById).not.toHaveBeenCalled();
  });

  it("returns 404 when the work order does not exist", async () => {
    const { app, store } = createTestApp();
    vi.mocked(store.findById).mockResolvedValue(null);

    const response = await request(app).get(`/api/work-orders/${workOrderId}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: "WORK_ORDER_NOT_FOUND",
        message: `Work order ${workOrderId} does not exist.`,
      },
    });
  });
});

describe("GET /api/work-orders", () => {
  it("uses default pagination", async () => {
    const { app, store } = createTestApp();
    vi.mocked(store.list).mockResolvedValue([]);

    const response = await request(app).get("/api/work-orders");

    expect(response.status).toBe(200);
    expect(store.list).toHaveBeenCalledWith({
      limit: 20,
      offset: 0,
    });
  });

  it("coerces and uses requested pagination", async () => {
    const { app, store } = createTestApp();
    vi.mocked(store.list).mockResolvedValue([]);

    const response = await request(app).get(
      "/api/work-orders?limit=10&offset=20",
    );

    expect(response.status).toBe(200);
    expect(response.body.pagination).toEqual({
      limit: 10,
      offset: 20,
    });
    expect(store.list).toHaveBeenCalledWith({
      limit: 10,
      offset: 20,
    });
  });

  it("rejects invalid pagination", async () => {
    const { app, store } = createTestApp();

    const response = await request(app).get(
      "/api/work-orders?limit=101&offset=-1",
    );

    expect(response.status).toBe(400);
    expect(store.list).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/work-orders/:id", () => {
  it("updates allowed fields", async () => {
    const { app, store } = createTestApp();

    const updated = {
      ...workOrder,
      status: "in_progress",
      priority: "critical",
      updatedAt: new Date("2026-08-13T13:00:00.000Z"),
    } satisfies WorkOrder;

    vi.mocked(store.update).mockResolvedValue(updated);

    const response = await request(app)
      .patch(`/api/work-orders/${workOrderId}`)
      .send({
        status: "in_progress",
        priority: "critical",
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: workOrderId,
      status: "in_progress",
      priority: "critical",
      updatedAt: "2026-08-13T13:00:00.000Z",
    });

    expect(store.update).toHaveBeenCalledWith(workOrderId, {
      status: "in_progress",
      priority: "critical",
    });
  });

  it("rejects an empty patch", async () => {
    const { app, store } = createTestApp();

    const response = await request(app)
      .patch(`/api/work-orders/${workOrderId}`)
      .send({});

    expect(response.status).toBe(400);
    expect(store.update).not.toHaveBeenCalled();
  });

  it("rejects unsupported fields", async () => {
    const { app, store } = createTestApp();

    const response = await request(app)
      .patch(`/api/work-orders/${workOrderId}`)
      .send({ createdBy });

    expect(response.status).toBe(400);
    expect(store.update).not.toHaveBeenCalled();
  });

  it("returns 404 when updating a missing work order", async () => {
    const { app, store } = createTestApp();
    vi.mocked(store.update).mockResolvedValue(null);

    const response = await request(app)
      .patch(`/api/work-orders/${workOrderId}`)
      .send({ priority: "critical" });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("WORK_ORDER_NOT_FOUND");
  });
});

describe("DELETE /api/work-orders/:id", () => {
  it("deletes an existing work order", async () => {
    const { app, store } = createTestApp();
    vi.mocked(store.delete).mockResolvedValue(true);

    const response = await request(app).delete(
      `/api/work-orders/${workOrderId}`,
    );

    expect(response.status).toBe(204);
    expect(response.text).toBe("");
    expect(store.delete).toHaveBeenCalledWith(workOrderId);
  });

  it("returns 404 when deleting a missing work order", async () => {
    const { app, store } = createTestApp();
    vi.mocked(store.delete).mockResolvedValue(false);

    const response = await request(app).delete(
      `/api/work-orders/${workOrderId}`,
    );

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("WORK_ORDER_NOT_FOUND");
  });
});

describe("error handling", () => {
  it("returns a structured error for an unknown route", async () => {
    const { app } = createTestApp();

    const response = await request(app).get("/api/unknown");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: "ROUTE_NOT_FOUND",
        message: "The requested route does not exist.",
      },
    });
  });

  it("does not expose unexpected internal errors", async () => {
    const { app, store } = createTestApp();
    vi.mocked(store.findById).mockRejectedValue(
      new Error("database password leaked here"),
    );

    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const response = await request(app).get(`/api/work-orders/${workOrderId}`);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred.",
      },
    });

    expect(response.text).not.toContain("database password");
    consoleError.mockRestore();
  });
});
