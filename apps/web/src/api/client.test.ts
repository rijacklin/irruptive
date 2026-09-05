import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, requestJson } from "./client";

afterEach(() => vi.unstubAllGlobals());

describe("requestJson", () => {
  it("trims a server error message and preserves HTTP status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { message: "  You cannot request analysis.  " },
          }),
          { status: 403 },
        ),
      ),
    );

    await expect(
      requestJson("/api/example", "Unable to load example"),
    ).rejects.toMatchObject({
      name: "ApiError",
      status: 403,
      message: "You cannot request analysis.",
    });
  });

  it.each([
    "<html>Unavailable</html>",
    "null",
    "{}",
    '{"error":{"message":42}}',
    '{"error":{"message":" "}}',
  ])("uses the fallback for an unusable error body: %s", async (body) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(body, { status: 503 })),
    );
    await expect(
      requestJson("/api/example", "Unable to load example"),
    ).rejects.toEqual(new ApiError("Unable to load example (503).", 503));
  });

  it.each([
    new TypeError("Failed to fetch"),
    new DOMException("Aborted", "AbortError"),
  ])("preserves transport and cancellation errors: %s", async (error) => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(error));
    await expect(
      requestJson("/api/example", "Unable to load example"),
    ).rejects.toBe(error);
  });
});
