import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AIAnalysisApiError,
  createAIAnalysis,
  getAIAnalysis,
} from "@/api/ai-analysis";

/**
 * Ensures a unique key is used for caching records that associate AI analyses with work orders.
 *
 * @param workOrderId - ID of associated work order.
 * @returns
 */
export const aiAnalysisQueryKey = (workOrderId: string) => [
  "work-orders",
  workOrderId,
  "ai-analysis",
];

/**
 * Queries the latest stored AI analysis for a work order.
 *
 * @param workOrderId - ID of associated work order.
 * @returns A useQuery result that will contain data of type 'GetAIAnalysisResponse'.
 */
export function useAIAnalysis(workOrderId: string) {
  return useQuery({
    queryKey: aiAnalysisQueryKey(workOrderId),
    queryFn: ({ signal }) => getAIAnalysis(workOrderId, signal),
    retry: (failureCount, error) => {
      if (
        error instanceof AIAnalysisApiError &&
        error.status >= 400 &&
        error.status < 500
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

/**
 * Generates a mutation for the create AI analysis server operation and stores the result into the shared query cache on success.
 *
 * @param workOrderId - ID of associated work order.
 * @returns A TanStack Query mutation for the create-analysis operation.
 */
export function useCreateAIAnalysis(workOrderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => createAIAnalysis(workOrderId),
    onSuccess: (analysis) => {
      queryClient.setQueryData(aiAnalysisQueryKey(workOrderId), analysis);
    },
  });
}
