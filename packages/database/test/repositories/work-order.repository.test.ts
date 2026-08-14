import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { config } from "dotenv";
import { Pool } from "pg";
import { WorkOrderRepository } from "../../src/index.js";

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

describe("WorkOrderRepository", () => {
  describe("create", () => {
    it("creates a work order with database defaults", async () => {
      const createdBy = await createUser();

      const workOrder = await repository.create({
        title: "Conveyor intermittently stopping",
        description: "Operator reports grinding before shutdown.",
        createdBy,
      });

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
      const createdBy = await createUser();
      const assignedTo = await createUser();

      const workOrder = await repository.create({
        title: "Inspect damaged guard",
        description:
          "The safety guard is visibly bent near the drive assembly.",
        priority: "high",
        category: "Mechanical",
        createdBy,
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
      const createdBy = await createUser();

      const created = await repository.create({
        title: "Inspect damaged guard",
        description:
          "The safety guard is visibly bent near the drive assembly.",
        createdBy,
      });

      await expect(repository.findById(created.id)).resolves.toEqual(created);
    });

    it("returns null when a work order does not exist", async () => {
      await expect(repository.findById(randomUUID())).resolves.toBeNull();
    });
  });

  describe("list", () => {
    it("lists work orders with pagination", async () => {
      const createdBy = await createUser();

      const first = await repository.create({
        title: "First reported issue",
        description: "The first sufficiently detailed work-order description.",
        createdBy,
      });

      const second = await repository.create({
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
  });

  describe("update", () => {
    it("updates a work order priority", async () => {
      const createdBy = await createUser();

      const created = await repository.create({
        title: "Conveyor intermittently stopping",
        description: "Operator reports grinding before shutdown.",
        createdBy,
      });

      const updated = await repository.update(created.id, {
        priority: "critical",
      });

      expect(updated).toMatchObject({
        id: created.id,
        title: created.title,
        description: created.description,
        priority: "critical",
        createdBy,
      });

      expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(
        created.updatedAt.getTime(),
      );
    });

    it("returns null when updating a missing work order", async () => {
      await expect(
        repository.update(randomUUID(), { priority: "critical" }),
      ).resolves.toBeNull();
    });

    it("only updates status if other fields are not provided", async () => {
      const createdBy = await createUser();

      const created = await repository.create({
        title: "Remove obsolete report",
        description: "This work order was created for deletion testing.",
        createdBy,
      });

      const updated = await repository.update(created.id, {
        status: "blocked",
      });

      expect(updated).toMatchObject({
        id: created.id,
        title: created.title,
        description: created.description,
        status: "blocked",
        priority: created.priority,
        category: created.category,
        createdBy: created.createdBy,
        assignedTo: created.assignedTo,
        createdAt: created.createdAt,
      });

      expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(
        created.updatedAt.getTime(),
      );
    });

    it("only updates category if other fields are not provided", async () => {
      const createdBy = await createUser();

      const created = await repository.create({
        title: "Remove obsolete report",
        description: "This work order was created for deletion testing.",
        createdBy,
      });

      const updated = await repository.update(created.id, {
        category: "Obsolete",
      });

      expect(updated).toMatchObject({
        id: created.id,
        title: created.title,
        description: created.description,
        status: created.status,
        priority: created.priority,
        category: "Obsolete",
        createdBy: created.createdBy,
        assignedTo: created.assignedTo,
        createdAt: created.createdAt,
      });

      expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(
        created.updatedAt.getTime(),
      );
    });

    it("only updates assignment if other fields are not provided", async () => {
      const createdBy = await createUser();
      const assignedTo = await createUser();

      const created = await repository.create({
        title: "Remove obsolete report",
        description: "This work order was created for deletion testing.",
        createdBy,
      });

      const updated = await repository.update(created.id, {
        assignedTo: assignedTo,
      });

      expect(updated).toMatchObject({
        id: created.id,
        title: created.title,
        description: created.description,
        status: created.status,
        priority: created.priority,
        category: created.category,
        createdBy: created.createdBy,
        assignedTo: assignedTo,
        createdAt: created.createdAt,
      });

      expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(
        created.updatedAt.getTime(),
      );
    });

    it("handles setting assignee to null", async () => {
      const createdBy = await createUser();
      const assignedTo = await createUser();

      const created = await repository.create({
        title: "Remove obsolete report",
        description: "This work order was created for deletion testing.",
        createdBy,
        assignedTo,
      });

      expect(created.assignedTo).toBe(assignedTo);

      const updated = await repository.update(created.id, {
        assignedTo: null,
      });

      expect(updated?.assignedTo).toBeNull();

      expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(
        created.updatedAt.getTime(),
      );
    });

    it("clears the category when category is null", async () => {
      const createdBy = await createUser();

      const created = await repository.create({
        title: "Remove obsolete report",
        description: "This work order was created for deletion testing.",
        category: "Mechanical",
        createdBy,
      });

      expect(created.category).toBe("Mechanical");

      const updated = await repository.update(created.id, {
        category: null,
      });

      expect(updated?.category).toBeNull();

      expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(
        created.updatedAt.getTime(),
      );
    });

    it("updates multiple fields together", async () => {
      const createdBy = await createUser();
      const assignedTo = await createUser();

      const created = await repository.create({
        title: "Conveyor intermittently stopping",
        description: "Operator reports grinding before shutdown.",
        createdBy,
      });

      const updated = await repository.update(created.id, {
        status: "assigned",
        priority: "high",
        category: "Mechanical",
        assignedTo,
      });

      expect(updated).toMatchObject({
        id: created.id,
        status: "assigned",
        priority: "high",
        category: "Mechanical",
        assignedTo,
      });
    });

    it("rejects an update with no fields", async () => {
      await expect(repository.update(randomUUID(), {})).rejects.toThrow(
        "Update requires at least one field",
      );
    });
  });

  describe("delete", () => {
    it("deletes an existing work order", async () => {
      const createdBy = await createUser();

      const workOrder = await repository.create({
        title: "Remove obsolete report",
        description: "This work order was created for deletion testing.",
        createdBy,
      });

      await expect(repository.delete(workOrder.id)).resolves.toBe(true);
      await expect(repository.findById(workOrder.id)).resolves.toBeNull();
    });

    it("returns false when deleting a missing work order", async () => {
      await expect(repository.delete(randomUUID())).resolves.toBe(false);
    });
  });
});
