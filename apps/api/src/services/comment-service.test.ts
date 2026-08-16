import type {
  Comment,
  CreateCommentInput,
  WorkOrder,
} from "@irruptive/database";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthorizationActor } from "../authorization/work-order-authorization.js";
import {
  CommentService,
  type CommentStore,
  type WorkOrderLookup,
} from "./comment-service.js";

describe("CommentService", () => {
  let comments: CommentStore;
  let workOrders: WorkOrderLookup;
  let service: CommentService;

  const actor: AuthorizationActor = {
    id: "5b8e1aae-cb0d-48c7-a76e-47bb04e65972",
    role: "requester",
  };
  const workOrder: WorkOrder = {
    id: "6efd02fb-37ae-4685-b0c8-d7408afbf3b3",
    title: "Conveyor intermittently stopping",
    description: "Operator reports grinding before shutdown.",
    status: "open",
    priority: "medium",
    category: null,
    createdBy: actor.id,
    assignedTo: null,
    createdAt: new Date("2026-08-16T14:00:00.000Z"),
    updatedAt: new Date("2026-08-16T14:00:00.000Z"),
  };
  const input: Omit<CreateCommentInput, "userId"> = {
    workOrderId: workOrder.id,
    body: "The drive bearing is visibly worn.",
  };
  const comment: Comment = {
    id: "f2788448-c88d-4e9a-9efe-d98150acc457",
    ...input,
    userId: actor.id,
    createdAt: new Date("2026-08-16T14:05:00.000Z"),
  };

  beforeEach(() => {
    comments = { create: vi.fn(), listByWorkOrderId: vi.fn() };
    workOrders = { findById: vi.fn() };
    service = new CommentService(comments, workOrders);
  });

  it("creates a comment for an authorized work-order participant", async () => {
    vi.mocked(workOrders.findById).mockResolvedValue(workOrder);
    vi.mocked(comments.create).mockResolvedValue(comment);

    await expect(service.create(actor, input)).resolves.toEqual(comment);
    expect(comments.create).toHaveBeenCalledWith({
      ...input,
      userId: actor.id,
    });
  });

  it("rejects comments from unrelated requesters", async () => {
    vi.mocked(workOrders.findById).mockResolvedValue(workOrder);

    await expect(
      service.create(
        { id: "11111111-1111-4111-8111-111111111111", role: "requester" },
        input,
      ),
    ).rejects.toMatchObject({ code: "AUTHORIZATION_DENIED", status: 403 });
    expect(comments.create).not.toHaveBeenCalled();
  });

  it("does not create a comment when the work order does not exist", async () => {
    vi.mocked(workOrders.findById).mockResolvedValue(null);

    await expect(service.create(actor, input)).rejects.toMatchObject({
      code: "WORK_ORDER_NOT_FOUND",
    });
  });

  it("lists comments for an authorized work-order participant", async () => {
    vi.mocked(workOrders.findById).mockResolvedValue(workOrder);
    vi.mocked(comments.listByWorkOrderId).mockResolvedValue([comment]);

    await expect(service.list(actor, workOrder.id)).resolves.toEqual([comment]);
    expect(comments.listByWorkOrderId).toHaveBeenCalledWith(workOrder.id);
  });

  it("does not list comments when the work order does not exist", async () => {
    vi.mocked(workOrders.findById).mockResolvedValue(null);

    await expect(service.list(actor, workOrder.id)).rejects.toMatchObject({
      code: "WORK_ORDER_NOT_FOUND",
    });
    expect(comments.listByWorkOrderId).not.toHaveBeenCalled();
  });
});
