import type {
  CreateCommentRequest,
  CreateCommentResponse,
  ListCommentsResponse,
} from "@irruptive/shared";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export class CommentApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "CommentApiError";
  }
}

export async function listComments(
  workOrderId: string,
  signal?: AbortSignal,
): Promise<ListCommentsResponse> {
  const url = new URL(
    `/api/work-orders/${encodeURIComponent(workOrderId)}/comments`,
    apiBaseUrl,
  );
  const response = await fetch(url, {
    credentials: "include",
    headers: { Accept: "application/json" },
    ...(signal !== undefined ? { signal } : {}),
  });

  if (!response.ok) {
    throw new CommentApiError(
      `Unable to load comments (${response.status}).`,
      response.status,
    );
  }

  return (await response.json()) as ListCommentsResponse;
}

export async function createComment(
  workOrderId: string,
  input: CreateCommentRequest,
): Promise<CreateCommentResponse> {
  const url = new URL(
    `/api/work-orders/${encodeURIComponent(workOrderId)}/comments`,
    apiBaseUrl,
  );
  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new CommentApiError(
      `Unable to add comment (${response.status}).`,
      response.status,
    );
  }

  return (await response.json()) as CreateCommentResponse;
}
