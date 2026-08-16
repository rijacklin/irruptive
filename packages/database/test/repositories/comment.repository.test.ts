import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { Pool } from "pg";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  CommentRepository,
  WorkOrderRepository,
  type Comment,
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
const commentRepository = new CommentRepository(pool);
const workOrderRepository = new WorkOrderRepository(pool);

beforeAll(async () => {
  await pool.query("select 1");
});

afterEach(async () => {
  await pool.query("DELETE FROM comments");
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
    [id, "Test Commenter", `${id}@example.com`, "technician"],
  );

  return id;
}

async function createWorkOrder(createdBy: string): Promise<string> {
  const workOrder = await workOrderRepository.create({
    title: "Conveyor intermittently stopping",
    description: "Operator reports grinding before shutdown.",
    createdBy,
  });

  return workOrder.id;
}

async function setCreatedAt(comment: Comment, createdAt: string) {
  await pool.query("UPDATE comments SET created_at = $1 WHERE id = $2", [
    createdAt,
    comment.id,
  ]);
}

describe("CommentRepository", () => {
  it("creates and maps a comment", async () => {
    const userId = await createUser();
    const workOrderId = await createWorkOrder(userId);

    const comment = await commentRepository.create({
      workOrderId,
      userId,
      body: "The drive bearing is visibly worn.",
    });

    expect(comment).toMatchObject({
      workOrderId,
      userId,
      body: "The drive bearing is visibly worn.",
    });
    expect(comment.id).toEqual(expect.any(String));
    expect(comment.createdAt).toBeInstanceOf(Date);
  });

  it("lists only comments for the requested work order chronologically", async () => {
    const userId = await createUser();
    const workOrderId = await createWorkOrder(userId);
    const otherWorkOrderId = await createWorkOrder(userId);

    const laterComment = await commentRepository.create({
      workOrderId,
      userId,
      body: "Replacement approved.",
    });
    const earlierComment = await commentRepository.create({
      workOrderId,
      userId,
      body: "Bearings appear worn.",
    });
    await commentRepository.create({
      workOrderId: otherWorkOrderId,
      userId,
      body: "This belongs to another work order.",
    });

    await setCreatedAt(laterComment, "2026-08-16T15:00:00.000Z");
    await setCreatedAt(earlierComment, "2026-08-16T14:00:00.000Z");

    const comments = await commentRepository.listByWorkOrderId(workOrderId);

    expect(comments.map((comment) => comment.id)).toEqual([
      earlierComment.id,
      laterComment.id,
    ]);
  });

  it("orders comments with equal timestamps by id", async () => {
    const userId = await createUser();
    const workOrderId = await createWorkOrder(userId);

    const first = await commentRepository.create({
      workOrderId,
      userId,
      body: "First comment created.",
    });
    const second = await commentRepository.create({
      workOrderId,
      userId,
      body: "Second comment created.",
    });
    const sharedTimestamp = "2026-08-16T14:00:00.000Z";

    await setCreatedAt(first, sharedTimestamp);
    await setCreatedAt(second, sharedTimestamp);

    const comments = await commentRepository.listByWorkOrderId(workOrderId);
    const expectedIds = [first.id, second.id].sort();

    expect(comments.map((comment) => comment.id)).toEqual(expectedIds);
  });
});
