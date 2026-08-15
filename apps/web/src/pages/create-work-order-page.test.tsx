import "@testing-library/jest-dom/vitest";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CreateWorkOrderResponse } from "@irruptive/shared";

import { createWorkOrder } from "@/api/work-order";
import { CreateWorkOrderPage } from "./create-work-order-page";

vi.mock("@/api/work-order", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/work-order")>();

  return {
    ...actual,
    createWorkOrder: vi.fn(),
  };
});

const createdBy = "234173b3-13a5-43c8-baf7-bf06640cf7fd";
const response: CreateWorkOrderResponse = {
  data: {
    id: "6efd02fb-37ae-4685-b0c8-d7408afbf3b3",
    title: "Conveyor intermittently stopping",
    description: "Operator reports grinding before shutdown.",
    status: "open",
    priority: "high",
    category: "Mechanical",
    createdBy,
    assignedTo: null,
    createdAt: "2026-08-15T12:00:00.000Z",
    updatedAt: "2026-08-15T12:00:00.000Z",
  },
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderCreatePage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: {
        retry: false,
      },
      queries: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/work-orders/new"]}>
        <Routes>
          <Route path="/work-orders/new" element={<CreateWorkOrderPage />} />
          <Route
            path="/work-orders/:id"
            element={<h1>Created work order</h1>}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function completeRequiredFields() {
  const user = userEvent.setup();

  await user.type(
    screen.getByRole("textbox", { name: "Title" }),
    response.data.title,
  );
  await user.type(
    screen.getByRole("textbox", { name: "Description" }),
    response.data.description,
  );
  await user.type(
    screen.getByRole("textbox", { name: "Creator user ID" }),
    createdBy,
  );

  return user;
}

describe("CreateWorkOrderPage", () => {
  it("creates a work order and navigates to its details", async () => {
    vi.mocked(createWorkOrder).mockResolvedValue(response);
    renderCreatePage();

    const user = await completeRequiredFields();
    await user.click(screen.getByRole("combobox", { name: "Priority" }));
    await user.click(await screen.findByRole("option", { name: "High" }));
    expect(
      screen.getByRole("combobox", { name: "Priority" }),
    ).toHaveTextContent("High");
    await user.type(
      screen.getByRole("textbox", { name: /Category/ }),
      "  Mechanical  ",
    );
    await user.click(screen.getByRole("button", { name: "Create work order" }));

    expect(
      await screen.findByRole("heading", { name: "Created work order" }),
    ).toBeInTheDocument();
    expect(createWorkOrder).toHaveBeenCalledWith({
      title: response.data.title,
      description: response.data.description,
      priority: "high",
      category: "Mechanical",
      createdBy,
    });
  });

  it("displays an API failure without navigating away", async () => {
    vi.mocked(createWorkOrder).mockRejectedValue(
      new Error("Unable to create work order (500)."),
    );
    renderCreatePage();

    const user = await completeRequiredFields();
    await user.click(screen.getByRole("button", { name: "Create work order" }));

    const alert = await screen.findByRole("alert");

    expect(alert).toHaveTextContent("Could not create work order");
    expect(alert).toHaveTextContent("Unable to create work order (500).");
    expect(
      screen.getByRole("heading", { name: "Create work order" }),
    ).toBeInTheDocument();
    expect(createWorkOrder).toHaveBeenCalledTimes(1);
  });
});
