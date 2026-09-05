import type {
  CreateAIAnalysisResponse,
  GetAIAnalysisResponse,
} from "@irruptive/shared";
import { requestJson } from "./client";

export function getAIAnalysis(
  workOrderId: string,
  signal?: AbortSignal,
): Promise<GetAIAnalysisResponse> {
  return requestJson(
    `/api/work-orders/${encodeURIComponent(workOrderId)}/ai-analysis`,
    "AI analysis request failed",
    { ...(signal !== undefined ? { signal } : {}) },
  );
}
export function createAIAnalysis(
  workOrderId: string,
): Promise<CreateAIAnalysisResponse> {
  return requestJson(
    `/api/work-orders/${encodeURIComponent(workOrderId)}/ai-analysis`,
    "AI analysis request failed",
    { method: "POST" },
  );
}
