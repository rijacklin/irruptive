import { afterEach, describe, expect, it, vi } from "vitest";
import { listWorkOrderActivity } from "./work-order-activity";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("listWorkOrderActivity", () => {
  it("requests the work-order activity endpoint", async () => {
    const response = { data: [] };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(listWorkOrderActivity("work/order id")).resolves.toEqual(
      response,
    );
    expect(fetchMock).toHaveBeenCalledWith(
      new URL(
        "http://localhost:3000/api/work-orders/work%2Forder%20id/activity",
      ),
      {
        credentials: "include",
        headers: { Accept: "application/json" },
      },
    );
  });
});
