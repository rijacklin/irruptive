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
};

function validationCase<Input>(
  name: string,
  input: Input,
  expectedPath: string,
) {
  return { name, input, expectedPath };
}

const invalidCreateCases = [
  validationCase(
    "missing title",
    { description: validCreateBody.description },
    "title",
  ),
  validationCase(
    "title below minimum length",
    { ...validCreateBody, title: "ab" },
    "title",
  ),
  validationCase(
    "title above maximum length",
    { ...validCreateBody, title: "a".repeat(201) },
    "title",
  ),
  validationCase(
    "missing description",
    { title: validCreateBody.title },
    "description",
  ),
  validationCase(
    "description below minimum length",
    { ...validCreateBody, description: "123456789" },
    "description",
  ),
  validationCase(
    "invalid priority",
    { ...validCreateBody, priority: "urgent" },
    "priority",
  ),
  validationCase(
    "blank category",
    { ...validCreateBody, category: "   " },
    "category",
  ),
];

const invalidPatchCases = [
  validationCase("invalid priority", { priority: "urgent" }, "priority"),
  validationCase("invalid status", { status: "working" }, "status"),
  validationCase("blank category", { category: "   " }, "category"),
  validationCase(
    "invalid assignee",
    { assignedTo: "not-a-uuid" },
    "assignedTo",
  ),
];

const clearFieldCases = [
  { name: "category", body: { category: null } },
  { name: "assignment", body: { assignedTo: null } },
];

const invalidPaginationCases = [
  validationCase("limit below minimum", "limit=0", "limit"),
  validationCase("limit above maximum", "limit=101", "limit"),
  validationCase("fractional limit", "limit=1.5", "limit"),
  validationCase("non-numeric limit", "limit=abc", "limit"),
  validationCase("negative offset", "offset=-1", "offset"),
  validationCase("fractional offset", "offset=1.5", "offset"),
  validationCase("non-numeric offset", "offset=abc", "offset"),
];

function expectValidationError(
  response: {
    status: number;
    body: { error: { details: unknown[] } };
  },
  expectedPath: string,
) {
  expect(response.status).toBe(400);
  expect(response.body.error.details).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        path: expectedPath,
      }),
    ]),
  );
}

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
      createdBy: "11111111-1111-4111-8111-111111111111",
      status: "closed",
    });

    expect(response.status).toBe(400);
    expect(store.create).not.toHaveBeenCalled();
  });

  it.for(invalidCreateCases)(
    "rejects $name",
    async ({ input: body, expectedPath }) => {
      const { app, store } = createTestApp();

      const response = await request(app).post("/api/work-orders").send(body);

      expectValidationError(response, expectedPath);
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
    async ({ input: query, expectedPath }) => {
      const { app, store } = createTestApp();

      const response = await request(app).get(`/api/work-orders?${query}`);

      expectValidationError(response, expectedPath);
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

  it("assigns an eligible technician", async () => {
    const { app, store, userStore } = createTestApp();
    const assignedTo = "98bbd3ae-d7ab-46f4-b348-9f51b65fbadc";

    vi.mocked(userStore.findAssignableById).mockResolvedValue({
      id: assignedTo,
      name: "Alex Technician",
      email: "alex@example.com",
      role: "technician",
      createdAt: new Date("2026-08-13T12:00:00.000Z"),
    });
    vi.mocked(store.update).mockResolvedValue({
      ...workOrder,
      assignedTo,
    });

    const response = await request(app)
      .patch(`/api/work-orders/${workOrderId}`)
      .send({ assignedTo });

    expect(response.status).toBe(200);
    expect(response.body.data.assignedTo).toBe(assignedTo);
    expect(store.update).toHaveBeenCalledWith(workOrderId, { assignedTo });
  });

  it("rejects an ineligible assignee", async () => {
    const { app, store, userStore } = createTestApp();
    const assignedTo = "98bbd3ae-d7ab-46f4-b348-9f51b65fbadc";
    vi.mocked(userStore.findAssignableById).mockResolvedValue(null);

    const response = await request(app)
      .patch(`/api/work-orders/${workOrderId}`)
      .send({ assignedTo });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe("ASSIGNEE_NOT_ELIGIBLE");
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

  it.for(invalidPatchCases)(
    "rejects $name",
    async ({ input: body, expectedPath }) => {
      const { app, store } = createTestApp();

      const response = await request(app)
        .patch(`/api/work-orders/${workOrderId}`)
        .send(body);

      expectValidationError(response, expectedPath);
      expect(store.update).not.toHaveBeenCalled();
    },
  );

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
