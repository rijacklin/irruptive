import "@testing-library/jest-dom/vitest";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GetWorkOrderResponse } from "@irruptive/shared";

import { getWorkOrder, WorkOrderApiError } from "@/api/work-order";
import { WorkOrderDetailsPage } from "./work-order-details-page";

vi.mock("@/api/work-order", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/work-order")>();
  return {
    ...actual,
    getWorkOrder: vi.fn(),
  };
});

const response: GetWorkOrderResponse = {
  data: {
    id: "6efd02fb-37ae-4685-b0c8-d7408afbf3b3",
    title: "Conveyor intermittently stopping",
    description: "Operator reports a grinding noise before shutdown.",
    status: "open",
    priority: "high",
    category: "Mechanical",
    createdBy: "11111111-1111-4111-8111-111111111111",
    assignedTo: null,
    createdAt: "2026-08-14T12:00:00.000Z",
    updatedAt: "2026-08-14T12:00:00.000Z",
  },
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderDetailsPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/work-orders/${response.data.id}`]}>
        <Routes>
          <Route path="/work-orders/:id" element={<WorkOrderDetailsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("WorkOrderDetailsPage", () => {
  it("renders the requested work order", async () => {
    vi.mocked(getWorkOrder).mockResolvedValue(response);

    renderDetailsPage();

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Conveyor intermittently stopping",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Operator reports a grinding noise before shutdown."),
    ).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("Mechanical")).toBeInTheDocument();
    expect(screen.getByText("Unassigned")).toBeInTheDocument();

    expect(getWorkOrder).toHaveBeenCalledWith(
      response.data.id,
      expect.any(AbortSignal),
    );
  });

  it("renders an error when the work order cannot be loaded", async () => {
    vi.mocked(getWorkOrder).mockRejectedValue(
      new WorkOrderApiError("Unable to load work order (404).", 404),
    );

    renderDetailsPage();

    const alert = await screen.findByRole("alert");

    expect(alert).toHaveTextContent("Could not load work order");
    expect(alert).toHaveTextContent("Unable to load work order (404).");
    expect(
      screen.getByRole("link", { name: "Back to work orders" }),
    ).toHaveAttribute("href", "/work-orders");

    expect(getWorkOrder).toHaveBeenCalledTimes(1);
  });
});
