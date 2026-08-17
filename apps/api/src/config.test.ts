import { describe, expect, it } from "vitest";
import { loadEnvironment } from "./config.js";

const baseEnvironment = {
  DATABASE_URL: "postgresql://localhost/irruptive",
  BETTER_AUTH_SECRET: "test-secret-with-at-least-thirty-two-characters",
};

describe("AI environment configuration", () => {
  it("allows the API to start without an AI provider", () => {
    const environment = loadEnvironment(baseEnvironment);
    expect(environment).not.toHaveProperty("AI_PROVIDER");
    expect(environment.AI_TIMEOUT_MS).toBe(15_000);
  });

  it("requires provider-specific model and credentials when OpenAI is enabled", () => {
    expect(() =>
      loadEnvironment({ ...baseEnvironment, AI_PROVIDER: "openai" }),
    ).toThrow("Invalid environment configuration");
  });
});
