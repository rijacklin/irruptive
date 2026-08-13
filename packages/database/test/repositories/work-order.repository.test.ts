import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, expect, it } from "vitest";
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

it("creates a work order with database defaults", async () => {
  const createdBy = await createUser();

  const workOrder = await repository.create({
    title: "Conveyer intermittently stopping",
    description: "Operator reports grinding before shutdown.",
    createdBy,
  });

  expect(workOrder).toMatchObject({
    title: "Conveyer intermittently stopping",
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
    description: "The safety guard is visibly bent near the drive assembly.",
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

it("finds a work order by id", async () => {
  const createdBy = await createUser();

  const created = await repository.create({
    title: "Inspect damaged guard",
    description: "The safety guard is visibly bent near the drive assembly.",
    createdBy,
  });

  await expect(repository.findById(created.id)).resolves.toEqual(created);
});

it("returns null when a work order does not exist", async () => {
  await expect(repository.findById(randomUUID())).resolves.toBeNull();
});

it("lists work orders with pagination", async () => {
  const createdBy = await createUser();

  const first = await repository.create({
    title: "First reported issue",
    description: "The first sufficiently detailed work-order description.",
    createdBy,
  });

  const second = await repository.create({
    title: "Secon reported issue",
    description: "The second sufficiently detailed work-order description.",
    createdBy,
  });

  const results = await repository.list({
    limit: 1,
    offset: 0,
  });

  expect(results).toHaveLength(1);
  expect([first.id, second.id]).toContain(results[0]?.id);
});
