import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { authClient } from "@/lib/auth-client";
import { RequireSession } from "./require-session";

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("RequireSession", () => {
  it("redirects an unauthenticated user to login", async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
      isRefetching: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/work-orders/123"]}>
        <Routes>
          <Route
            path="/work-orders/:id"
            element={
              <RequireSession>
                <h1>Protected work order</h1>
              </RequireSession>
            }
          />
          <Route path="/login" element={<h1>Sign in</h1>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Protected work order")).not.toBeInTheDocument();
  });
});
