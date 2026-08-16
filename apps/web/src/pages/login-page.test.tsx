import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authClient } from "@/lib/auth-client";
import { LoginPage } from "./login-page";

const refetch = vi.fn();

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: vi.fn(),
    signIn: {
      email: vi.fn(),
    },
  },
}));

beforeEach(() => {
  vi.mocked(authClient.useSession).mockReturnValue({
    data: null,
    isPending: false,
    isRefetching: false,
    error: null,
    refetch,
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderLogin() {
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/work-orders" element={<h1>Work orders</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  it("signs in and navigates to work orders", async () => {
    vi.mocked(authClient.signIn.email).mockResolvedValue({
      data: {
        redirect: false,
        token: "session-token",
        url: undefined,
        user: {
          id: "11111111-1111-4111-8111-111111111111",
          name: "Alex Requester",
          email: "alex@example.com",
          emailVerified: true,
          image: null,
          createdAt: new Date("2026-08-16T12:00:00.000Z"),
          updatedAt: new Date("2026-08-16T12:00:00.000Z"),
          role: "requester",
        },
      },
      error: null,
    });
    renderLogin();

    const user = userEvent.setup();
    await user.type(
      screen.getByRole("textbox", { name: "Email" }),
      "alex@example.com",
    );
    await user.type(
      screen.getByLabelText("Password"),
      "correct-horse-battery-staple",
    );
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(authClient.signIn.email).toHaveBeenCalledWith({
      email: "alex@example.com",
      password: "correct-horse-battery-staple",
    });
    expect(refetch).toHaveBeenCalledOnce();
    expect(
      await screen.findByRole("heading", { name: "Work orders" }),
    ).toBeInTheDocument();
  });

  it("shows a generic error for invalid credentials", async () => {
    vi.mocked(authClient.signIn.email).mockResolvedValue({
      data: null,
      error: {
        status: 401,
        statusText: "UNAUTHORIZED",
        message: "Invalid email or password",
      },
    });
    renderLogin();

    const user = userEvent.setup();
    await user.type(
      screen.getByRole("textbox", { name: "Email" }),
      "alex@example.com",
    );
    await user.type(screen.getByLabelText("Password"), "incorrect-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The email or password is incorrect.",
    );
  });
});
