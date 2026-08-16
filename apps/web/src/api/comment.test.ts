import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  CreateCommentResponse,
  ListCommentsResponse,
} from "@irruptive/shared";
import { CommentApiError, createComment, listComments } from "./comment";

const workOrderId = "6efd02fb-37ae-4685-b0c8-d7408afbf3b3";
const userId = "234173b3-13a5-43c8-baf7-bf06640cf7fd";

const comment = {
  id: "8e33a153-d529-4e22-829e-e83d4f313d38",
  workOrderId,
  userId,
  body: "The drive bearing is visibly worn.",
  createdAt: "2026-08-13T12:05:00.000Z",
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("comment API", () => {
  it("lists comments for the requested work order", async () => {
    const responseBody: ListCommentsResponse = { data: [comment] };
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const signal = new AbortController().signal;

    await expect(listComments(workOrderId, signal)).resolves.toEqual(
      responseBody,
    );
    expect(fetchMock).toHaveBeenCalledWith(
      new URL(`http://localhost:3000/api/work-orders/${workOrderId}/comments`),
      {
        headers: { Accept: "application/json" },
        signal,
      },
    );
  });

  it("posts a comment as JSON", async () => {
    const responseBody: CreateCommentResponse = { data: comment };
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(responseBody), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createComment(workOrderId, { userId, body: comment.body }),
    ).resolves.toEqual(responseBody);
    expect(fetchMock).toHaveBeenCalledWith(
      new URL(`http://localhost:3000/api/work-orders/${workOrderId}/comments`),
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, body: comment.body }),
      },
    );
  });

  it("throws a typed error when comment creation is rejected", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response(null, { status: 422 })),
    );

    await expect(
      createComment(workOrderId, { userId, body: comment.body }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<CommentApiError>>({
        name: "CommentApiError",
        message: "Unable to add comment (422).",
        status: 422,
      }),
    );
  });
});
