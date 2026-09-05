import type {
  CreateCommentRequest,
  CreateCommentResponse,
  ListCommentsResponse,
} from "@irruptive/shared";
import { requestJson } from "./client";

export function listComments(
  workOrderId: string,
  signal?: AbortSignal,
): Promise<ListCommentsResponse> {
  return requestJson(
    `/api/work-orders/${encodeURIComponent(workOrderId)}/comments`,
    "Unable to load comments",
    { ...(signal !== undefined ? { signal } : {}) },
  );
}
export function createComment(
  workOrderId: string,
  input: CreateCommentRequest,
): Promise<CreateCommentResponse> {
  return requestJson(
    `/api/work-orders/${encodeURIComponent(workOrderId)}/comments`,
    "Unable to add comment",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}
