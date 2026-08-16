import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateCommentRequest,
  ListCommentsResponse,
} from "@irruptive/shared";
import { createComment } from "@/api/comment";
import { commentsQueryKey } from "@/hooks/use-comments";
import { workOrderActivityQueryKey } from "@/hooks/use-work-order-activity";

export function useCreateComment(workOrderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCommentRequest) =>
      createComment(workOrderId, input),
    onSuccess: async (response) => {
      queryClient.setQueryData<ListCommentsResponse>(
        commentsQueryKey(workOrderId),
        (current) => ({
          data: [...(current?.data ?? []), response.data],
        }),
      );

      await queryClient.invalidateQueries({
        queryKey: workOrderActivityQueryKey(workOrderId),
      });
    },
  });
}
