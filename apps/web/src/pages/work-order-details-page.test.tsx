import "@testing-library/jest-dom/vitest";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  CommentResponse,
  GetWorkOrderResponse,
  ListCommentsResponse,
  ListUsersResponse,
  UpdateWorkOrderResponse,
  UserResponse,
} from "@irruptive/shared";

import {
  getWorkOrder,
  updateWorkOrder,
  WorkOrderApiError,
} from "@/api/work-order";
import { createComment, listComments } from "@/api/comment";
import { listUsers } from "@/api/user";
import { WorkOrderDetailsPage } from "./work-order-details-page";

vi.mock("@/api/work-order", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/work-order")>();
  return {
    ...actual,
    getWorkOrder: vi.fn(),
    updateWorkOrder: vi.fn(),
  };
});

vi.mock("@/api/comment", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/comment")>();
  return {
    ...actual,
    createComment: vi.fn(),
    listComments: vi.fn(),
  };
});

vi.mock("@/api/user", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/user")>();
  return {
    ...actual,
    listUsers: vi.fn(),
  };
});

const technician: UserResponse = {
  id: "98bbd3ae-d7ab-46f4-b348-9f51b65fbadc",
  name: "Alex Technician",
  email: "alex@example.com",
  role: "technician",
  createdAt: "2026-08-14T11:00:00.000Z",
};

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

const existingComment: CommentResponse = {
  id: "8e33a153-d529-4e22-829e-e83d4f313d38",
  workOrderId: response.data.id,
  userId: response.data.createdBy,
  body: "The drive bearing is visibly worn.",
  createdAt: "2026-08-14T12:05:00.000Z",
};

beforeEach(() => {
  const comments: ListCommentsResponse = { data: [] };
  const technicians: ListUsersResponse = { data: [technician] };
  vi.mocked(listComments).mockResolvedValue(comments);
  vi.mocked(listUsers).mockResolvedValue(technicians);
});

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
    expect(
      screen.getByRole("combobox", { name: "Assignee" }),
    ).toHaveTextContent("Unassigned");

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
    });
  });

  it("assigns a technician", async () => {
    vi.mocked(getWorkOrder).mockResolvedValue(response);
    vi.mocked(updateWorkOrder).mockResolvedValue({
      data: {
        ...response.data,
        assignedTo: technician.id,
        updatedAt: "2026-08-15T13:00:00.000Z",
      },
    });
    renderDetailsPage();

    const user = userEvent.setup();
    const assigneeSelect = await screen.findByRole("combobox", {
      name: "Assignee",
    });

    await user.click(assigneeSelect);
    await user.click(screen.getByRole("option", { name: technician.name }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(updateWorkOrder).toHaveBeenCalledWith(response.data.id, {
      assignedTo: technician.id,
    });
    expect(await screen.findByText("Work order updated.")).toBeInTheDocument();
    expect(assigneeSelect).toHaveTextContent(technician.name);
  });

  it("renders comments and adds a normalized comment", async () => {
    const addedComment: CommentResponse = {
      ...existingComment,
      id: "1293a583-3b77-46b0-a54e-a490551b2c5e",
      body: "Replacement bearing has been ordered.",
      createdAt: "2026-08-14T12:10:00.000Z",
    };
    vi.mocked(getWorkOrder).mockResolvedValue(response);
    vi.mocked(listComments).mockResolvedValue({ data: [existingComment] });
    vi.mocked(createComment).mockResolvedValue({ data: addedComment });
    renderDetailsPage();

    expect(await screen.findByText(existingComment.body)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.type(
      screen.getByRole("textbox", { name: "Add a comment" }),
      `  ${addedComment.body}  `,
    );
    await user.click(screen.getByRole("button", { name: "Add comment" }));

    expect(createComment).toHaveBeenCalledWith(response.data.id, {
      body: addedComment.body,
    });
    expect(await screen.findByText(addedComment.body)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Comment added.");
    expect(screen.getByRole("textbox", { name: "Add a comment" })).toHaveValue(
      "",
    );
  });
});
