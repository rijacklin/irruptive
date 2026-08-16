import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateCommentRequest,
  ListCommentsResponse,
} from "@irruptive/shared";
import { createComment } from "@/api/comment";
import { commentsQueryKey } from "@/hooks/use-comments";

export function useCreateComment(workOrderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCommentRequest) =>
      createComment(workOrderId, input),
    onSuccess: (response) => {
      queryClient.setQueryData<ListCommentsResponse>(
        commentsQueryKey(workOrderId),
        (current) => ({
          data: [...(current?.data ?? []), response.data],
        }),
      );
    },
  });
}
