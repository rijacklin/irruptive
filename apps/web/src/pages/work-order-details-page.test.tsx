import "@testing-library/jest-dom/vitest";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  GetWorkOrderResponse,
  UpdateWorkOrderResponse,
} from "@irruptive/shared";

import {
  getWorkOrder,
  updateWorkOrder,
  WorkOrderApiError,
} from "@/api/work-order";
import { WorkOrderDetailsPage } from "./work-order-details-page";

vi.mock("@/api/work-order", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/work-order")>();
  return {
    ...actual,
    getWorkOrder: vi.fn(),
    updateWorkOrder: vi.fn(),
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

const updatedResponse: UpdateWorkOrderResponse = {
  data: {
    ...response.data,
    status: "in_progress",
    priority: "critical",
    updatedAt: "2026-08-15T13:00:00.000Z",
  },
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderDetailsPage() {
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
    expect(screen.getByRole("combobox", { name: "Status" })).toHaveTextContent(
      "Open",
    );
    expect(
      screen.getByRole("combobox", { name: "Priority" }),
    ).toHaveTextContent("High");
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

  it("updates the status and priority", async () => {
    vi.mocked(getWorkOrder).mockResolvedValue(response);
    vi.mocked(updateWorkOrder).mockResolvedValue(updatedResponse);
    renderDetailsPage();

    const user = userEvent.setup();
    const statusSelect = await screen.findByRole("combobox", {
      name: "Status",
    });
    const prioritySelect = screen.getByRole("combobox", {
      name: "Priority",
    });
    const saveButton = screen.getByRole("button", { name: "Save changes" });

    expect(saveButton).toBeDisabled();

    await user.click(statusSelect);
    await user.click(screen.getByRole("option", { name: "In progress" }));
    await user.click(prioritySelect);
    await user.click(screen.getByRole("option", { name: "Critical" }));
    await user.click(saveButton);

    expect(updateWorkOrder).toHaveBeenCalledWith(response.data.id, {
      status: "in_progress",
      priority: "critical",
    });
    expect(await screen.findByText("Work order updated.")).toBeInTheDocument();
    expect(statusSelect).toHaveTextContent("In progress");
    expect(prioritySelect).toHaveTextContent("Critical");
    expect(saveButton).toBeDisabled();
  });

  it("displays an update failure and preserves the selected values", async () => {
    vi.mocked(getWorkOrder).mockResolvedValue(response);
    vi.mocked(updateWorkOrder).mockRejectedValue(
      new Error("Unable to update work order (500)."),
    );
    renderDetailsPage();

    const user = userEvent.setup();
    const statusSelect = await screen.findByRole("combobox", {
      name: "Status",
    });

    await user.click(statusSelect);
    await user.click(screen.getByRole("option", { name: "Blocked" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    const alert = await screen.findByRole("alert");

    expect(alert).toHaveTextContent("Could not update work order");
    expect(alert).toHaveTextContent("Unable to update work order (500).");
    expect(statusSelect).toHaveTextContent("Blocked");
    expect(updateWorkOrder).toHaveBeenCalledWith(response.data.id, {
      status: "blocked",
      priority: "high",
    });
  });
});
