import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import type { WorkOrderResponse } from "@irruptive/shared";

import { WorkOrderTable } from "./work-order-table";

const workOrder: WorkOrderResponse = {
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
};

afterEach(() => {
  cleanup();
});

describe("WorkOrderTable", () => {
  it("renders work-order data", () => {
    render(
      <MemoryRouter>
        <WorkOrderTable workOrders={[workOrder]} isLoading={false} />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", {
        name: "Conveyor intermittently stopping",
      }),
    ).toHaveAttribute("href", `/work-orders/${workOrder.id}`);
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("Mechanical")).toBeInTheDocument();
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });

  it("renders an empty state", () => {
    render(<WorkOrderTable workOrders={[]} isLoading={false} />);

    expect(screen.getByText("No work orders found.")).toBeInTheDocument();
  });

  it("renders loading placeholders", () => {
    const { container } = render(
      <WorkOrderTable workOrders={[]} isLoading={true} />,
    );

    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(
      30,
    );
    expect(screen.queryByText("No work orders found.")).not.toBeInTheDocument();
  });
});
