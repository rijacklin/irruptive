import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { config } from "dotenv";
import { Pool } from "pg";
import {
  WorkOrderRepository,
  type CreateWorkOrderInput,
  type WorkOrder,
} from "../../src/index.js";

config({
  path: new URL("../../../../.env", import.meta.url),
  quiet: true,
});

const connectionString = process.env.TEST_DATABASE_URL;

if (!connectionString) {
  throw new Error("TEST_DATABASE_URL is required for repository tests");
}

const pool = new Pool({ connectionString });
const repository = new WorkOrderRepository(pool);

beforeAll(async () => {
  await pool.query("select 1");
});

afterEach(async () => {
  await pool.query("DELETE FROM work_orders");
  await pool.query("DELETE FROM users");
});

afterAll(async () => {
  await pool.end();
});

async function createUser(): Promise<string> {
  const id = randomUUID();

  await pool.query(
    `
      INSERT INTO users (id, name, email, role)
      VALUES ($1, $2, $3, $4)
    `,
    [id, "Test Requester", `${id}@example.com`, "requester"],
  );

  return id;
}

async function createWorkOrder(
  overrides: Partial<CreateWorkOrderInput> = {},
): Promise<WorkOrder> {
  return repository.create({
    title: "Conveyor intermittently stopping",
    description: "Operator reports grinding before shutdown.",
    ...overrides,
    createdBy: overrides.createdBy ?? (await createUser()),
  });
}

function expectUpdatedAfter(updated: WorkOrder | null, original: WorkOrder) {
  expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(
    original.updatedAt.getTime(),
  );
}

describe("WorkOrderRepository", () => {
  describe("create", () => {
    it("creates a work order with database defaults", async () => {
      const createdBy = await createUser();
      const workOrder = await createWorkOrder({ createdBy });

      expect(workOrder).toMatchObject({
        title: "Conveyor intermittently stopping",
        description: "Operator reports grinding before shutdown.",
        status: "open",
        priority: "medium",
        category: null,
        createdBy,
        assignedTo: null,
      });

      expect(workOrder.id).toEqual(expect.any(String));
      expect(workOrder.createdAt).toBeInstanceOf(Date);
      expect(workOrder.updatedAt).toBeInstanceOf(Date);
    });

    it("creates a work order with optional values", async () => {
      const assignedTo = await createUser();

      const workOrder = await createWorkOrder({
        title: "Inspect damaged guard",
        description:
          "The safety guard is visibly bent near the drive assembly.",
        priority: "high",
        category: "Mechanical",
        assignedTo,
      });

      expect(workOrder).toMatchObject({
        priority: "high",
        category: "Mechanical",
        assignedTo,
      });
    });
  });

  describe("findById", () => {
    it("finds a work order by id", async () => {
      const created = await createWorkOrder();

      await expect(repository.findById(created.id)).resolves.toEqual(created);
    });

    it("returns null when a work order does not exist", async () => {
      await expect(repository.findById(randomUUID())).resolves.toBeNull();
    });
  });

  describe("list", () => {
    it("lists work orders with pagination", async () => {
      const createdBy = await createUser();

      const first = await createWorkOrder({
        title: "First reported issue",
        description: "The first sufficiently detailed work-order description.",
        createdBy,
      });

      const second = await createWorkOrder({
        title: "Second reported issue",
        description: "The second sufficiently detailed work-order description.",
        createdBy,
      });

      const firstPage = await repository.list({
        limit: 1,
        offset: 0,
      });

      const secondPage = await repository.list({
        limit: 1,
        offset: 1,
      });

      expect(firstPage).toHaveLength(1);
      expect(secondPage).toHaveLength(1);
      expect(firstPage[0]?.id).not.toBe(secondPage[0]?.id);

      expect(new Set([firstPage[0]?.id, secondPage[0]?.id])).toEqual(
        new Set([first.id, second.id]),
      );
    });

    it("applies ownership and assignment visibility before pagination", async () => {
      const firstRequester = await createUser();
      const secondRequester = await createUser();
      const technician = await createUser();
      const owned = await createWorkOrder({ createdBy: firstRequester });
      const assigned = await createWorkOrder({
        createdBy: secondRequester,
        assignedTo: technician,
      });
      await createWorkOrder({ createdBy: secondRequester });

      await expect(
        repository.list({ limit: 20, offset: 0, createdBy: firstRequester }),
      ).resolves.toEqual([owned]);
      await expect(
        repository.list({ limit: 20, offset: 0, assignedTo: technician }),
      ).resolves.toEqual([assigned]);
    });
  });

  describe("update", () => {
    it("updates a work order priority", async () => {
      const created = await createWorkOrder();

      const updated = await repository.update(created.id, {
        priority: "critical",
      });

      expect(updated).toEqual({
        ...created,
        priority: "critical",
        updatedAt: expect.any(Date),
      });
      expectUpdatedAfter(updated, created);
    });

    it("returns null when updating a missing work order", async () => {
      await expect(
        repository.update(randomUUID(), { priority: "critical" }),
      ).resolves.toBeNull();
    });

    it("only updates status if other fields are not provided", async () => {
      const created = await createWorkOrder();

      const updated = await repository.update(created.id, {
        status: "blocked",
      });

      expect(updated).toEqual({
        ...created,
        status: "blocked",
        updatedAt: expect.any(Date),
      });
      expectUpdatedAfter(updated, created);
    });

    it("only updates category if other fields are not provided", async () => {
      const created = await createWorkOrder();

      const updated = await repository.update(created.id, {
        category: "Obsolete",
      });

      expect(updated).toEqual({
        ...created,
        category: "Obsolete",
        updatedAt: expect.any(Date),
      });
      expectUpdatedAfter(updated, created);
    });

    it("only updates assignment if other fields are not provided", async () => {
      const assignedTo = await createUser();
      const created = await createWorkOrder();

      const updated = await repository.update(created.id, {
        assignedTo,
      });

      expect(updated).toEqual({
        ...created,
        assignedTo,
        updatedAt: expect.any(Date),
      });
      expectUpdatedAfter(updated, created);
    });

    it("handles setting assignee to null", async () => {
      const assignedTo = await createUser();
      const created = await createWorkOrder({ assignedTo });

      const updated = await repository.update(created.id, {
        assignedTo: null,
      });

      expect(updated).toEqual({
        ...created,
        assignedTo: null,
        updatedAt: expect.any(Date),
      });
      expectUpdatedAfter(updated, created);
    });

    it("clears the category when category is null", async () => {
      const created = await createWorkOrder({ category: "Mechanical" });

      const updated = await repository.update(created.id, {
        category: null,
      });

      expect(updated).toEqual({
        ...created,
        category: null,
        updatedAt: expect.any(Date),
      });
      expectUpdatedAfter(updated, created);
    });

    it("updates multiple fields together", async () => {
      const assignedTo = await createUser();
      const created = await createWorkOrder();

      const updated = await repository.update(created.id, {
        status: "assigned",
        priority: "high",
        category: "Mechanical",
        assignedTo,
      });

      expect(updated).toEqual({
        ...created,
        status: "assigned",
        priority: "high",
        category: "Mechanical",
        assignedTo,
        updatedAt: expect.any(Date),
      });
      expectUpdatedAfter(updated, created);
    });

    it("rejects an update with no fields", async () => {
      await expect(repository.update(randomUUID(), {})).rejects.toThrow(
        "Update requires at least one field",
      );
    });
  });

  describe("delete", () => {
    it("deletes an existing work order", async () => {
      const workOrder = await createWorkOrder();

      await expect(repository.delete(workOrder.id)).resolves.toBe(true);
      await expect(repository.findById(workOrder.id)).resolves.toBeNull();
    });

    it("returns false when deleting a missing work order", async () => {
      await expect(repository.delete(randomUUID())).resolves.toBe(false);
    });
  });
});
