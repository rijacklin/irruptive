import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { config } from "dotenv";
import { Pool } from "pg";
import { UserRepository } from "../../src/index.js";

config({
  path: new URL("../../../../.env", import.meta.url),
  quiet: true,
});

const connectionString = process.env.TEST_DATABASE_URL;

if (!connectionString) {
  throw new Error("TEST_DATABASE_URL is required for repository tests");
}

const pool = new Pool({ connectionString });
const repository = new UserRepository(pool);

beforeAll(async () => {
  await pool.query("select 1");
});

afterEach(async () => {
  await pool.query("DELETE FROM users");
});

afterAll(async () => {
  await pool.end();
});

async function createUser(name: string, role: "requester" | "technician") {
  const id = randomUUID();

  await pool.query(
    `
      INSERT INTO users (id, name, email, role)
      VALUES ($1, $2, $3, $4)
    `,
    [id, name, `${id}@example.com`, role],
  );

  return id;
}

describe("UserRepository", () => {
  it("lists users filtered by role in name order", async () => {
    const requesterId = await createUser("Robin Requester", "requester");
    const secondId = await createUser("Taylor Technician", "technician");
    const firstId = await createUser("Alex Technician", "technician");

    const users = await repository.list({ role: "technician" });

    expect(users.map(({ id, name, role }) => ({ id, name, role }))).toEqual([
      { id: firstId, name: "Alex Technician", role: "technician" },
      { id: secondId, name: "Taylor Technician", role: "technician" },
    ]);
    expect(users.map((user) => user.id)).not.toContain(requesterId);
  });

  it("only finds technicians as assignable", async () => {
    const technicianId = await createUser("Alex Technician", "technician");
    const requesterId = await createUser("Robin Requester", "requester");

    await expect(repository.findAssignableById(technicianId)).resolves.toEqual(
      expect.objectContaining({ id: technicianId, role: "technician" }),
    );
    await expect(
      repository.findAssignableById(requesterId),
    ).resolves.toBeNull();
  });
});
