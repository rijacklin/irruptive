import { describe, expect, it } from "vitest";
import { ApiError } from "@/api/client";
import { retryQuery } from "./query-retry";

describe("retryQuery", () => {
  it.each([400, 401, 403, 404, 422, 429, 499])(
    "does not retry HTTP %s",
    (status) => {
      expect(retryQuery(0, new ApiError("Rejected", status))).toBe(false);
    },
  );

  it.each([new ApiError("Unavailable", 503), new TypeError("Failed to fetch")])(
    "allows at most two retries for transient failures: %s",
    (error) => {
      expect(retryQuery(0, error)).toBe(true);
      expect(retryQuery(1, error)).toBe(true);
      expect(retryQuery(2, error)).toBe(false);
    },
  );
});
