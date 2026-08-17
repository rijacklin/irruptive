import { describe, expect, it, vi } from "vitest";
import { aiAnalysisSchema } from "./ai-provider.js";
import { OpenAIProvider } from "./openai-provider.js";

function providerWithResponse(response: Response) {
  return new OpenAIProvider({
    apiKey: "test-key",
    model: "test-model",
    timeoutMs: 100,
    fetch: vi.fn().mockResolvedValue(response),
  });
}

describe("AI analysis output contract", () => {
  it.each([
    { summary: "Missing fields" },
    {
      summary: "Bad priority",
      suggestedCategory: null,
      suggestedPriority: "urgent",
      suggestedActions: [],
    },
    {
      summary: "Bad action",
      suggestedCategory: null,
      suggestedPriority: null,
      suggestedActions: [""],
    },
  ])("rejects malformed structured output", (output) => {
    expect(aiAnalysisSchema.safeParse(output).success).toBe(false);
  });
});

describe("OpenAIProvider failure classification", () => {
  it.each([
    { status: 429, kind: "rate_limit" },
    { status: 500, kind: "upstream" },
  ])("maps upstream status $status", async ({ status, kind }) => {
    const provider = providerWithResponse(new Response("{}", { status }));

    await expect(
      provider.analyzeWorkOrder({ title: "Title", description: "Description" }),
    ).rejects.toMatchObject({ kind });
  });

  it("maps timeouts", async () => {
    const provider = new OpenAIProvider({
      apiKey: "test-key",
      model: "test-model",
      timeoutMs: 1,
      fetch: vi.fn(
        (_url, init) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () =>
              reject(new DOMException("Aborted", "AbortError")),
            );
          }),
      ),
    });

    await expect(
      provider.analyzeWorkOrder({ title: "Title", description: "Description" }),
    ).rejects.toMatchObject({ kind: "timeout" });
  });
});
