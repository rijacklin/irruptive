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
import type { Pool } from "pg";
import type { AIProvider } from "../ai/ai-provider.js";
import type { AuthorizationActor } from "../authorization/work-order-authorization.js";
import { createIntegrationTestApp } from "../test/create-integration-test-app.js";

const provider: AIProvider = {
  provider: "integration-fake",
  model: "integration-v1",
  analyzeWorkOrder: vi.fn(),
};

let testApp: Awaited<ReturnType<typeof createIntegrationTestApp>>;
let pool: Pool;

beforeAll(async () => {
  testApp = await createIntegrationTestApp({ aiProvider: provider });
  pool = testApp.pool;
});

afterEach(async () => {
  vi.mocked(provider.analyzeWorkOrder).mockReset();
  await pool.query("DELETE FROM work_orders");
  await pool.query("DELETE FROM users");
});

afterAll(async () => {
  await pool.end();
});

async function createFixture(role: AuthorizationActor["role"] = "supervisor") {
  const userId = randomUUID();
  const workOrderId = randomUUID();
  await pool.query(
    "INSERT INTO users (id, name, email, role) VALUES ($1, $2, $3, $4)",
    [userId, "AI Integration Tester", `${userId}@example.com`, role],
  );
  await pool.query(
    `INSERT INTO work_orders (id, title, description, created_by)
     VALUES ($1, $2, $3, $4)`,
    [
      workOrderId,
      "Inspect conveyor",
      "Grinding noise before shutdown.",
      userId,
    ],
  );
  const actor = { id: userId, role } satisfies AuthorizationActor;
  testApp.setActor(actor);
  return { actor, workOrderId };
}

describe("AI analysis API integration", () => {
  it("leaves the work order intact and stores nothing after invalid output", async () => {
    const { workOrderId } = await createFixture();
    const before = await pool.query("SELECT * FROM work_orders WHERE id = $1", [
      workOrderId,
    ]);
    vi.mocked(provider.analyzeWorkOrder).mockResolvedValue({
      summary: "Invalid",
      suggestedPriority: "urgent",
    } as never);

    const response = await request(testApp.app).post(
      `/api/work-orders/${workOrderId}/ai-analysis`,
    );
    const after = await pool.query("SELECT * FROM work_orders WHERE id = $1", [
      workOrderId,
    ]);
    const analyses = await pool.query(
      "SELECT id FROM ai_analyses WHERE work_order_id = $1",
      [workOrderId],
    );

    expect(response.status).toBe(502);
    expect(response.body.error.code).toBe("AI_PROVIDER_INVALID_OUTPUT");
    expect(after.rows).toEqual(before.rows);
    expect(analyses.rows).toEqual([]);
  });
});
