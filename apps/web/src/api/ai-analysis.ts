import type {
  CreateAIAnalysisResponse,
  GetAIAnalysisResponse,
} from "@irruptive/shared";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

interface ErrorResponse {
  error?: { message?: string };
}

/**
 * Defines typed structure for AI analysis error types.
 */
export class AIAnalysisApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AIAnalysisApiError";
  }
}

/**
 * Builds an 'AIAnalysisApiError' from a failed HTTP response.
 *
 * @param response - HTTP error response returned by fetch call.
 * @returns An 'AIAnalysisApiError' carrying the server message and response's HTTP status.
 */
async function getError(response: Response): Promise<AIAnalysisApiError> {
  const body = (await response.json().catch(() => ({}))) as ErrorResponse;

  return new AIAnalysisApiError(
    body.error?.message ?? `AI analysis request failed (${response.status}).`,
    response.status,
  );
}

/**
 * Retrieves the latest stored AI analysis for a given work order.
 *
 * @param workOrderId - ID of associated work order.
 * @param signal - Optional signal forwarded to fetch for query cancellation.
 * @returns A 'GetAIAnalysisResponse' contract.
 * @throws 'AIAnalysisApiError' if current request fails.
 */
export async function getAIAnalysis(
  workOrderId: string,
  signal?: AbortSignal,
): Promise<GetAIAnalysisResponse> {
  const url = new URL(
    `/api/work-orders/${encodeURIComponent(workOrderId)}/ai-analysis`,
    apiBaseUrl,
  );
  const response = await fetch(url, {
    credentials: "include",
    headers: { Accept: "application/json" },
    ...(signal !== undefined ? { signal } : {}),
  });

  if (!response.ok) {
    throw await getError(response);
  }

  return (await response.json()) as GetAIAnalysisResponse;
}

/**
 * Requests, stores, and returns a new AI analysis for a work order.
 *
 * TODO: Review
 *
 * @param workOrderId - ID of associated work order.
 * @returns A 'CreateAIAnalysisResponse' contract.
 * @throws 'AIAnalysisApiError' if current request fails.
 */
export async function createAIAnalysis(
  workOrderId: string,
): Promise<CreateAIAnalysisResponse> {
  const url = new URL(
    `/api/work-orders/${encodeURIComponent(workOrderId)}/ai-analysis`,
    apiBaseUrl,
  );
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw await getError(response);
  }

  return (await response.json()) as CreateAIAnalysisResponse;
}
