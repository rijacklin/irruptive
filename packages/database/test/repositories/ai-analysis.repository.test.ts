import { randomUUID } from "node:crypto";
import { config } from "dotenv";
import { Pool } from "pg";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { AIAnalysisRepository, WorkOrderRepository } from "../../src/index.js";

config({ path: new URL("../../../../.env", import.meta.url), quiet: true });

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString) {
  throw new Error("TEST_DATABASE_URL is required for repository tests");
}

const pool = new Pool({ connectionString });
const analyses = new AIAnalysisRepository(pool);
const workOrders = new WorkOrderRepository(pool);

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

async function createWorkOrder() {
  const userId = randomUUID();
  await pool.query(
    "INSERT INTO users (id, name, email, role) VALUES ($1, $2, $3, $4)",
    [userId, "AI Tester", `${userId}@example.com`, "supervisor"],
  );
  return workOrders.create({
    title: "Inspect conveyor",
    description: "Grinding noise before shutdown.",
    createdBy: userId,
  });
}

describe("AIAnalysisRepository", () => {
  it("enforces analysis integrity constraints", async () => {
    const workOrder = await createWorkOrder();
    const insert = (
      provider: string,
      priority: string | null,
      category: string | null,
      actions: string,
    ) =>
      pool.query(
        `INSERT INTO ai_analyses (
          work_order_id, provider, model, prompt_version, summary,
          suggested_priority, suggested_category, suggested_actions
        ) VALUES ($1, $2, 'model', 'prompt-v1', 'summary', $3, $4, $5::jsonb)`,
        [workOrder.id, provider, priority, category, actions],
      );

    await expect(insert(" ", null, null, "[]")).rejects.toThrow();
    await expect(insert("fake", "urgent", null, "[]")).rejects.toThrow();
    await expect(insert("fake", null, " ", "[]")).rejects.toThrow();
    await expect(insert("fake", null, null, "{}")).rejects.toThrow();
  });

  it("inserts, maps, and retrieves the latest analysis", async () => {
    const workOrder = await createWorkOrder();
    const first = await analyses.create({
      workOrderId: workOrder.id,
      provider: "fake",
      model: "v1",
      promptVersion: "work-order-analysis-v1",
      summary: "First analysis",
      suggestedPriority: null,
      suggestedCategory: null,
      suggestedActions: [],
    });
    const second = await analyses.create({
      workOrderId: workOrder.id,
      provider: "fake",
      model: "v2",
      promptVersion: "work-order-analysis-v1",
      summary: "Second analysis",
      suggestedPriority: "high",
      suggestedCategory: "Mechanical",
      suggestedActions: ["Inspect bearing"],
    });
    await pool.query("UPDATE ai_analyses SET created_at = $1 WHERE id = $2", [
      "2026-08-17T11:00:00.000Z",
      first.id,
    ]);
    await pool.query("UPDATE ai_analyses SET created_at = $1 WHERE id = $2", [
      "2026-08-17T12:00:00.000Z",
      second.id,
    ]);

    await expect(
      analyses.findLatestByWorkOrderId(workOrder.id),
    ).resolves.toMatchObject({
      id: second.id,
      workOrderId: workOrder.id,
      suggestedPriority: "high",
      suggestedActions: ["Inspect bearing"],
    });
  });

  it("cascades history when its work order is deleted", async () => {
    const workOrder = await createWorkOrder();
    await analyses.create({
      workOrderId: workOrder.id,
      provider: "fake",
      model: "v1",
      promptVersion: "work-order-analysis-v1",
      summary: "Analysis",
      suggestedPriority: null,
      suggestedCategory: null,
      suggestedActions: [],
    });

    await workOrders.delete(workOrder.id);

    await expect(
      analyses.findLatestByWorkOrderId(workOrder.id),
    ).resolves.toBeNull();
  });
});
