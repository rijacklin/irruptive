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

const validCreateBody = {
  title: "Conveyor intermittently stopping",
  description: "Operator reports grinding before shutdown.",
  priority: "high",
  category: "Mechanical",
  createdBy,
};

interface InvalidCreateCase {
  name: string;
  body: Record<string, unknown>;
  expectedPath: string;
}

const invalidCreateCases: InvalidCreateCase[] = [
  {
    name: "missing title",
    body: {
      description: validCreateBody.description,
      createdBy,
    },
    expectedPath: "title",
  },
  {
    name: "title below minimum length",
    body: {
      ...validCreateBody,
      title: "ab",
    },
    expectedPath: "title",
  },
  {
    name: "title above maximum length",
    body: {
      ...validCreateBody,
      title: "a".repeat(201),
    },
    expectedPath: "title",
  },
  {
    name: "missing description",
    body: {
      title: validCreateBody.title,
      createdBy,
    },
    expectedPath: "description",
  },
  {
    name: "description below minimum length",
    body: {
      ...validCreateBody,
      description: "123456789",
    },
    expectedPath: "description",
  },
  {
    name: "missing creator",
    body: {
      title: validCreateBody.title,
      description: validCreateBody.description,
    },
    expectedPath: "createdBy",
  },
  {
    name: "invalid creator UUID",
    body: {
      ...validCreateBody,
      createdBy: "not-a-uuid",
    },
    expectedPath: "createdBy",
  },
  {
    name: "invalid priority",
    body: {
      ...validCreateBody,
      priority: "urgent",
    },
    expectedPath: "priority",
  },
  {
    name: "blank category",
    body: {
      ...validCreateBody,
      category: "   ",
    },
    expectedPath: "category",
  },
];

interface InvalidPatchCase {
  name: string;
  body: Record<string, unknown>;
  expectedPath: string;
}

const invalidPatchCases: InvalidPatchCase[] = [
  {
    name: "invalid priority",
    body: { priority: "urgent" },
    expectedPath: "priority",
  },
  {
    name: "invalid status",
    body: { status: "working" },
    expectedPath: "status",
  },
  {
    name: "blank category",
    body: { category: "   " },
    expectedPath: "category",
  },
  {
    name: "invalid assignee",
    body: { assignedTo: "not-a-uuid" },
    expectedPath: "assignedTo",
  },
];

interface ClearFieldCase {
  name: string;
  body: {
    category?: null;
    assignedTo?: null;
  };
}

const clearFieldCases: ClearFieldCase[] = [
  {
    name: "category",
    body: { category: null },
  },
  {
    name: "assignment",
    body: { assignedTo: null },
  },
];

interface InvalidPaginationCase {
  name: string;
  query: string;
  expectedPath: "limit" | "offset";
}

const invalidPaginationCases: InvalidPaginationCase[] = [
  {
    name: "limit below minimum",
    query: "limit=0",
    expectedPath: "limit",
  },
  {
    name: "limit above maximum",
    query: "limit=101",
    expectedPath: "limit",
  },
  {
    name: "fractional limit",
    query: "limit=1.5",
    expectedPath: "limit",
  },
  {
    name: "non-numeric limit",
    query: "limit=abc",
    expectedPath: "limit",
  },
  {
    name: "negative offset",
    query: "offset=-1",
    expectedPath: "offset",
  },
  {
    name: "fractional offset",
    query: "offset=1.5",
    expectedPath: "offset",
  },
  {
    name: "non-numeric offset",
    query: "offset=abc",
    expectedPath: "offset",
  },
];

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

  it.for(invalidCreateCases)(
    "rejects $name",
    async ({ body, expectedPath }) => {
      const { app, store } = createTestApp();

      const response = await request(app).post("/api/work-orders").send(body);

      expect(response.status).toBe(400);

      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: expectedPath,
          }),
        ]),
      );

      expect(store.create).not.toHaveBeenCalled();
    },
  );
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

  it.for(invalidPaginationCases)(
    "rejects $name",
    async ({ query, expectedPath }) => {
      const { app, store } = createTestApp();

      const response = await request(app).get(`/api/work-orders?${query}`);

      expect(response.status).toBe(400);

      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: expectedPath,
          }),
        ]),
      );

      expect(store.list).not.toHaveBeenCalled();
    },
  );

  it("rejects unknown query parameters", async () => {
    const { app, store } = createTestApp();

    const response = await request(app).get("/api/work-orders?limti=10");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "unrecognized_keys",
        }),
      ]),
    );

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

  it.for(invalidPatchCases)("rejects $name", async ({ body, expectedPath }) => {
    const { app, store } = createTestApp();

    const response = await request(app)
      .patch(`/api/work-orders/${workOrderId}`)
      .send(body);

    expect(response.status).toBe(400);

    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: expectedPath,
        }),
      ]),
    );

    expect(store.update).not.toHaveBeenCalled();
  });

  it.for(clearFieldCases)("accepts clearing $name", async ({ body }) => {
    const { app, store } = createTestApp();

    vi.mocked(store.update).mockResolvedValue({
      ...workOrder,
      ...body,
    });

    const response = await request(app)
      .patch(`/api/work-orders/${workOrderId}`)
      .send(body);

    expect(response.status).toBe(200);
    expect(store.update).toHaveBeenCalledWith(workOrderId, body);
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

  it("returns 400 for malformed JSON", async () => {
    const { app, store } = createTestApp();

    const response = await request(app)
      .post("/api/work-orders")
      .set("Content-Type", "application/json")
      .send('{"title":');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: "INVALID_JSON",
        message: "The request body contains invalid JSON.",
      },
    });
    expect(store.create).not.toHaveBeenCalled();
  });
});
