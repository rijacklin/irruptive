import type {
  AIAnalysisResult,
  AIProvider,
  AnalyzeWorkOrderInput,
} from "./ai-provider.js";

export class FakeAIProvider implements AIProvider {
  readonly provider = "fake";
  readonly model = "deterministic-v1";

  async analyzeWorkOrder(
    input: AnalyzeWorkOrderInput,
  ): Promise<AIAnalysisResult> {
    return {
      summary: `Triage requested for: ${input.title}`,
      suggestedCategory: null,
      suggestedPriority: "medium",
      suggestedActions: ["Review the reported symptoms", "Inspect the asset"],
    };
  }
}
