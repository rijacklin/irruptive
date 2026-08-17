import { z } from "zod";
import { workOrderPriorities } from "@irruptive/shared";

/** fixed, versioned prompt identifier */
export const workOrderAnalysisPromptVersion = "work-order-analysis-v1";

/**
 * Validates an AI-provider response at runtime, conforming to OpenAI's structured model outputs documentation.
 */
export const aiAnalysisSchema = z.object({
  summary: z.string().trim().min(1),
  suggestedCategory: z.string().trim().min(1).nullable(),
  suggestedPriority: z.enum(workOrderPriorities).nullable(),
  suggestedActions: z.array(z.string().trim().min(1)),
});
export type AIAnalysisResult = z.infer<typeof aiAnalysisSchema>;

/**
 * Restricts data sent to the AI provider.
 */
export interface AnalyzeWorkOrderInput {
  title: string;
  description: string;
}

/**
 * Single structure for AI providers.
 */
export interface AIProvider {
  readonly provider: string;
  readonly model: string;
  analyzeWorkOrder(input: AnalyzeWorkOrderInput): Promise<AIAnalysisResult>;
}

/**
 * Defines typed structure for AI-provider error response types, which we map to our api responses.
 */
export type AIProviderFailureKind =
  "timeout" | "rate_limit" | "upstream" | "invalid_output";
export class AIProviderError extends Error {
  constructor(
    public readonly kind: AIProviderFailureKind,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "AIProviderError";
  }
}
