import { retryQuery } from "./query-retry";
import { useQuery } from "@tanstack/react-query";
import { listComments } from "@/api/comment";

export const commentsQueryKey = (workOrderId: string) =>
  ["work-orders", workOrderId, "comments"] as const;

export function useComments(workOrderId: string) {
  return useQuery({
    queryKey: commentsQueryKey(workOrderId),
    queryFn: ({ signal }) => listComments(workOrderId, signal),
    enabled: workOrderId.length > 0,
    retry: retryQuery,
  });
}
