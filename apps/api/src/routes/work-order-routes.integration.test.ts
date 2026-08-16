import { randomUUID } from "node:crypto";
import request from "supertest";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { WorkOrderResponse } from "@irruptive/shared";

import { createIntegrationTestApp } from "../test/create-integration-test-app.js";

let testApp: Awaited<ReturnType<typeof createIntegrationTestApp>>;

beforeAll(async () => {
  testApp = await createIntegrationTestApp();
});

afterEach(async () => {
  vi.restoreAllMocks();

  if (!testApp) {
    return;
  }

  await testApp.pool.query("DELETE FROM comments");
  await testApp.pool.query("DELETE FROM work_orders");
  await testApp.pool.query("DELETE FROM users");
});

afterAll(async () => {
  if (testApp) {
    await testApp.pool.end();
  }
});

async function createUser(): Promise<string> {
  const id = randomUUID();

  await testApp.pool.query(
    `
      INSERT INTO users (id, name, email, role)
      VALUES ($1, $2, $3, $4)
    `,
    [id, "API Integration Requester", `${id}@example.com`, "requester"],
  );

  return id;
}

async function createWorkOrder(
  createdBy: string,
  title: string,
): Promise<WorkOrderResponse> {
  const response = await request(testApp.app)
    .post("/api/work-orders")
    .send({
      title,
      description: `${title} requires investigation by a technician.`,
      createdBy,
    });

  expect(response.status).toBe(201);
  return response.body.data as WorkOrderResponse;
}

describe("work-order API integration", () => {
  it("creates and retrieves a persisted work order", async () => {
    const createdBy = await createUser();

    const createResponse = await request(testApp.app)
      .post("/api/work-orders")
      .send({
        title: "Conveyor intermittently stopping",
        description: "Operator reports grinding before shutdown.",
        createdBy,
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data).toMatchObject({
      title: "Conveyor intermittently stopping",
      description: "Operator reports grinding before shutdown.",
      status: "open",
      priority: "medium",
      category: null,
      createdBy,
      assignedTo: null,
    });
    expect(createResponse.body.data.id).toEqual(expect.any(String));
    expect(createResponse.body.data.createdAt).toEqual(expect.any(String));
    expect(createResponse.body.data.updatedAt).toEqual(expect.any(String));

    const workOrderId = createResponse.body.data.id as string;
    const getResponse = await request(testApp.app).get(
      `/api/work-orders/${workOrderId}`,
    );

    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toEqual(createResponse.body);

    const persisted = await testApp.pool.query<{ id: string }>(
      "SELECT id FROM work_orders WHERE id = $1",
      [workOrderId],
    );

    expect(persisted.rows).toEqual([{ id: workOrderId }]);

    const events = await testApp.pool.query<{
      event_type: string;
      event_data: Record<string, unknown>;
    }>(
      `
        SELECT event_type, event_data
        FROM work_order_events
        WHERE work_order_id = $1
      `,
      [workOrderId],
    );

    expect(events.rows).toEqual([
      expect.objectContaining({
        event_type: "work_order_created",
        event_data: expect.objectContaining({
          title: "Conveyor intermittently stopping",
          createdBy,
        }),
      }),
    ]);
  });

  it("lists persisted work orders with pagination", async () => {
    const createdBy = await createUser();
    const first = await createWorkOrder(createdBy, "Inspect conveyor guard");
    const second = await createWorkOrder(createdBy, "Check motor current");

    const firstPage = await request(testApp.app).get(
      "/api/work-orders?limit=1&offset=0",
    );
    const secondPage = await request(testApp.app).get(
      "/api/work-orders?limit=1&offset=1",
    );

    expect(firstPage.status).toBe(200);
    expect(firstPage.body.pagination).toEqual({ limit: 1, offset: 0 });
    expect(firstPage.body.data).toHaveLength(1);
    expect(secondPage.status).toBe(200);
    expect(secondPage.body.pagination).toEqual({ limit: 1, offset: 1 });
    expect(secondPage.body.data).toHaveLength(1);

    const returnedIds = [
      firstPage.body.data[0].id as string,
      secondPage.body.data[0].id as string,
    ];

    expect(new Set(returnedIds)).toEqual(new Set([first.id, second.id]));
  });

  it("updates persisted status and priority", async () => {
    const createdBy = await createUser();
    const workOrder = await createWorkOrder(
      createdBy,
      "Replace worn drive bearing",
    );

    const response = await request(testApp.app)
      .patch(`/api/work-orders/${workOrder.id}`)
      .send({ status: "in_progress", priority: "critical" });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: workOrder.id,
      status: "in_progress",
      priority: "critical",
    });

    const persisted = await testApp.pool.query<{
      status: string;
      priority: string;
    }>("SELECT status, priority FROM work_orders WHERE id = $1", [
      workOrder.id,
    ]);

    expect(persisted.rows).toEqual([
      { status: "in_progress", priority: "critical" },
    ]);

    const events = await testApp.pool.query<{
      event_type: string;
      event_data: Record<string, unknown>;
    }>(
      `
        SELECT event_type, event_data
        FROM work_order_events
        WHERE work_order_id = $1
        ORDER BY created_at, id
      `,
      [workOrder.id],
    );

    expect(events.rows.slice(1)).toEqual(
      expect.arrayContaining([
        {
          event_type: "status_changed",
          event_data: { previous: "open", current: "in_progress" },
        },
        {
          event_type: "priority_changed",
          event_data: { previous: "medium", current: "critical" },
        },
      ]),
    );
    expect(events.rows.slice(1)).toHaveLength(2);
  });

  it("deletes a persisted work order", async () => {
    const createdBy = await createUser();
    const workOrder = await createWorkOrder(
      createdBy,
      "Remove damaged belt section",
    );

    const deleteResponse = await request(testApp.app).delete(
      `/api/work-orders/${workOrder.id}`,
    );

    expect(deleteResponse.status).toBe(204);
    expect(deleteResponse.text).toBe("");

    const getResponse = await request(testApp.app).get(
      `/api/work-orders/${workOrder.id}`,
    );
    expect(getResponse.status).toBe(404);
    expect(getResponse.body.error.code).toBe("WORK_ORDER_NOT_FOUND");

    const persisted = await testApp.pool.query<{ id: string }>(
      "SELECT id FROM work_orders WHERE id = $1",
      [workOrder.id],
    );
    expect(persisted.rows).toEqual([]);
  });

  it("rejects invalid input without persisting a work order", async () => {
    const response = await request(testApp.app).post("/api/work-orders").send({
      title: "x",
      description: "This description is otherwise sufficiently detailed.",
      createdBy: randomUUID(),
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "title",
        }),
      ]),
    );

    const persisted = await testApp.pool.query<{ count: string }>(
      "SELECT COUNT(*) AS count FROM work_orders",
    );
    expect(persisted.rows).toEqual([{ count: "0" }]);
  });

  it("does not expose database failure details", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const response = await request(testApp.app).post("/api/work-orders").send({
      title: "Inspect unregistered equipment",
      description: "The creator UUID does not reference an existing user.",
      createdBy: randomUUID(),
    });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred.",
      },
    });
    expect(response.text).not.toContain("foreign key");
    expect(response.text).not.toContain("work_orders_created_by_fk");
    expect(consoleError).toHaveBeenCalledOnce();

    const persisted = await testApp.pool.query<{ count: string }>(
      "SELECT COUNT(*) AS count FROM work_orders",
    );
    expect(persisted.rows).toEqual([{ count: "0" }]);
  });

  it("creates and lists persisted comments chronologically", async () => {
    const createdBy = await createUser();
    const workOrder = await createWorkOrder(
      createdBy,
      "Inspect conveyor drive bearing",
    );

    const firstResponse = await request(testApp.app)
      .post(`/api/work-orders/${workOrder.id}/comments`)
      .send({
        userId: createdBy,
        body: "Bearing wear confirmed during inspection.",
      });
    const secondResponse = await request(testApp.app)
      .post(`/api/work-orders/${workOrder.id}/comments`)
      .send({
        userId: createdBy,
        body: "Replacement bearing has been ordered.",
      });

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(201);

    await testApp.pool.query(
      `
        UPDATE comments
        SET created_at = CASE id
          WHEN $1 THEN $3::timestamptz
          WHEN $2 THEN $4::timestamptz
        END
        WHERE id IN ($1, $2)
      `,
      [
        firstResponse.body.data.id,
        secondResponse.body.data.id,
        "2026-08-16T14:00:00.000Z",
        "2026-08-16T15:00:00.000Z",
      ],
    );

    const listResponse = await request(testApp.app).get(
      `/api/work-orders/${workOrder.id}/comments`,
    );

    expect(listResponse.status).toBe(200);
    expect(
      listResponse.body.data.map((item: { body: string }) => item.body),
    ).toEqual([
      "Bearing wear confirmed during inspection.",
      "Replacement bearing has been ordered.",
    ]);

    const persisted = await testApp.pool.query<{ count: string }>(
      "SELECT COUNT(*) AS count FROM comments WHERE work_order_id = $1",
      [workOrder.id],
    );
    expect(persisted.rows).toEqual([{ count: "2" }]);
  });
});
