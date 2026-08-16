import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Comment, WorkOrder, WorkOrderEvent } from "@irruptive/database";
import {
  WorkOrderActivityService,
  type ActivityCommentStore,
  type ActivityEventStore,
  type ActivityWorkOrderStore,
} from "./work-order-activity-service.js";

const workOrderId = "6efd02fb-37ae-4685-b0c8-d7408afbf3b3";
const actor = {
  id: "234173b3-13a5-43c8-baf7-bf06640cf7fd",
  role: "requester",
} as const;

const workOrder: WorkOrder = {
  id: workOrderId,
  title: "Inspect conveyor",
  description: "Inspect the conveyor drive assembly.",
  status: "open",
  priority: "medium",
  category: null,
  createdBy: "234173b3-13a5-43c8-baf7-bf06640cf7fd",
  assignedTo: null,
  createdAt: new Date("2026-08-16T12:00:00.000Z"),
  updatedAt: new Date("2026-08-16T12:00:00.000Z"),
};

describe("WorkOrderActivityService", () => {
  let workOrders: ActivityWorkOrderStore;
  let comments: ActivityCommentStore;
  let events: ActivityEventStore;
  let service: WorkOrderActivityService;

  beforeEach(() => {
    workOrders = { findById: vi.fn() };
    comments = { listByWorkOrderId: vi.fn() };
    events = { listByWorkOrderId: vi.fn() };
    service = new WorkOrderActivityService(workOrders, comments, events);
  });

  it("combines comments and events chronologically", async () => {
    const event: WorkOrderEvent = {
      id: "10000000-0000-4000-8000-000000000000",
      workOrderId,
      eventType: "work_order_created",
      eventData: { status: "open" },
      createdAt: new Date("2026-08-16T12:00:00.000Z"),
    };
    const comment: Comment = {
      id: "20000000-0000-4000-8000-000000000000",
      workOrderId,
      userId: workOrder.createdBy,
      body: "Inspection has started.",
      createdAt: new Date("2026-08-16T12:05:00.000Z"),
    };
    vi.mocked(workOrders.findById).mockResolvedValue(workOrder);
    vi.mocked(comments.listByWorkOrderId).mockResolvedValue([comment]);
    vi.mocked(events.listByWorkOrderId).mockResolvedValue([event]);

    await expect(service.list(actor, workOrderId)).resolves.toEqual([
      { kind: "event", event },
      { kind: "comment", comment },
    ]);
  });

  it("does not query activity when the work order is missing", async () => {
    vi.mocked(workOrders.findById).mockResolvedValue(null);

    await expect(service.list(actor, workOrderId)).rejects.toMatchObject({
      code: "WORK_ORDER_NOT_FOUND",
    });
    expect(comments.listByWorkOrderId).not.toHaveBeenCalled();
    expect(events.listByWorkOrderId).not.toHaveBeenCalled();
  });

  it("rejects activity access for an unrelated requester", async () => {
    vi.mocked(workOrders.findById).mockResolvedValue(workOrder);

    await expect(
      service.list(
        { id: "11111111-1111-4111-8111-111111111111", role: "requester" },
        workOrderId,
      ),
    ).rejects.toMatchObject({ code: "AUTHORIZATION_DENIED", status: 403 });
    expect(comments.listByWorkOrderId).not.toHaveBeenCalled();
    expect(events.listByWorkOrderId).not.toHaveBeenCalled();
  });
});
