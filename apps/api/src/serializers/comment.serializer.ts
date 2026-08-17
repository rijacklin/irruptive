import type { Comment } from "@irruptive/database";
import type { CommentResponse } from "@irruptive/shared";

/**
 * Serializes a stored comment record into its API response representation.
 *
 * @param comment - Database model to serialize.
 * @returns The API response DTO.
 */
export function serializeComment(comment: Comment): CommentResponse {
  return {
    id: comment.id,
    workOrderId: comment.workOrderId,
    userId: comment.userId,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
  };
}
