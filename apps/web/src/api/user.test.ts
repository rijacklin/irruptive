import { afterEach, describe, expect, it, vi } from "vitest";
import { listUsers } from "./user";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("listUsers", () => {
  it("requests users filtered by role", async () => {
    const response = { data: [] };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(listUsers("technician")).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith(
      new URL("http://localhost:3000/api/users?role=technician"),
      {
        credentials: "include",
        headers: { Accept: "application/json" },
      },
    );
  });
});
