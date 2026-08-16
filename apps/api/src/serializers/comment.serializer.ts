import type { Comment } from "@irruptive/database";
import type { CommentResponse } from "@irruptive/shared";

export function serializeComment(comment: Comment): CommentResponse {
  return {
    id: comment.id,
    workOrderId: comment.workOrderId,
    userId: comment.userId,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
  };
}
