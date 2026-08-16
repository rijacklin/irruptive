import { afterEach, describe, expect, it, vi } from "vitest";
import type { UpdateWorkOrderResponse } from "@irruptive/shared";

import { updateWorkOrder, WorkOrderApiError } from "./work-order";

const workOrderId = "6efd02fb-37ae-4685-b0c8-d7408afbf3b3";

const updatedResponse: UpdateWorkOrderResponse = {
  data: {
    id: workOrderId,
    title: "Conveyor intermittently stopping",
    description: "Operator reports grinding before shutdown.",
    status: "in_progress",
    priority: "critical",
    category: "Mechanical",
    createdBy: "234173b3-13a5-43c8-baf7-bf06640cf7fd",
    assignedTo: null,
    createdAt: "2026-08-15T12:00:00.000Z",
    updatedAt: "2026-08-15T13:00:00.000Z",
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("updateWorkOrder", () => {
  it("patches the requested work order with JSON", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(updatedResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      updateWorkOrder(workOrderId, {
        status: "in_progress",
        priority: "critical",
      }),
    ).resolves.toEqual(updatedResponse);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      new URL(`http://localhost:3000/api/work-orders/${workOrderId}`),
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "in_progress",
          priority: "critical",
        }),
      },
    );
  });

  it("throws a typed error when the update is rejected", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 422 }));
    vi.stubGlobal("fetch", fetchMock);

    const update = updateWorkOrder(workOrderId, { priority: "critical" });

    await expect(update).rejects.toEqual(
      expect.objectContaining<Partial<WorkOrderApiError>>({
        name: "WorkOrderApiError",
        message: "Unable to update work order (422).",
        status: 422,
      }),
    );
  });
});
