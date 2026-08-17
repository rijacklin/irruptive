import type { AIAnalysis } from "@irruptive/database";
import type { AIAnalysisResponse } from "@irruptive/shared";

/**
 * Serializes a stored AI analysis into its API response representation.
 *
 * @param analysis - Database model to serialize.
 * @returns The API response DTO.
 */
export function serializeAIAnalysis(analysis: AIAnalysis): AIAnalysisResponse {
  return {
    id: analysis.id,
    workOrderId: analysis.workOrderId,
    provider: analysis.provider,
    model: analysis.model,
    promptVersion: analysis.promptVersion,
    summary: analysis.summary,
    suggestedPriority: analysis.suggestedPriority,
    suggestedCategory: analysis.suggestedCategory,
    suggestedActions: analysis.suggestedActions,
    createdAt: analysis.createdAt.toISOString(),
  };
}
