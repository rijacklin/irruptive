import { useQuery } from "@tanstack/react-query";
import { CommentApiError, listComments } from "@/api/comment";

export const commentsQueryKey = (workOrderId: string) =>
  ["work-orders", workOrderId, "comments"] as const;

export function useComments(workOrderId: string) {
  return useQuery({
    queryKey: commentsQueryKey(workOrderId),
    queryFn: ({ signal }) => listComments(workOrderId, signal),
    enabled: workOrderId.length > 0,
    retry: (failureCount, error) => {
      if (
        error instanceof CommentApiError &&
        error.status >= 400 &&
        error.status < 500
      ) {
        return false;
      }

      return failureCount < 2;
    },
  });
}
