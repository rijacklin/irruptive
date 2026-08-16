import type {
  Comment,
  CreateCommentInput,
  WorkOrder,
} from "@irruptive/database";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CommentService,
  type CommentStore,
  type WorkOrderLookup,
} from "./comment-service.js";

describe("CommentService", () => {
  let comments: CommentStore;
  let workOrders: WorkOrderLookup;
  let service: CommentService;

  const workOrderId = "6efd02fb-37ae-4685-b0c8-d7408afbf3b3";
  const userId = "5b8e1aae-cb0d-48c7-a76e-47bb04e65972";

  const workOrder: WorkOrder = {
    id: workOrderId,
    title: "Conveyor intermittently stopping",
    description: "Operator reports grinding before shutdown.",
    status: "open",
    priority: "medium",
    category: null,
    createdBy: userId,
    assignedTo: null,
    createdAt: new Date("2026-08-16T14:00:00.000Z"),
    updatedAt: new Date("2026-08-16T14:00:00.000Z"),
  };

  const input: CreateCommentInput = {
    workOrderId,
    userId,
    body: "The drive bearing is visibly worn.",
  };

  const comment: Comment = {
    id: "f2788448-c88d-4e9a-9efe-d98150acc457",
    ...input,
    createdAt: new Date("2026-08-16T14:05:00.000Z"),
  };

  beforeEach(() => {
    comments = {
      create: vi.fn(),
      listByWorkOrderId: vi.fn(),
    };

    workOrders = {
      findById: vi.fn(),
    };

    service = new CommentService(comments, workOrders);
  });

  it("creates a comment after verifying the work order exists", async () => {
    vi.mocked(workOrders.findById).mockResolvedValue(workOrder);
    vi.mocked(comments.create).mockResolvedValue(comment);

    await expect(service.create(input)).resolves.toEqual(comment);

    expect(workOrders.findById).toHaveBeenCalledWith(workOrderId);
    expect(comments.create).toHaveBeenCalledWith(input);
  });

  it("does not create a comment when the work order does not exist", async () => {
    vi.mocked(workOrders.findById).mockResolvedValue(null);

    await expect(service.create(input)).rejects.toMatchObject({
      code: "WORK_ORDER_NOT_FOUND",
    });
    expect(comments.create).not.toHaveBeenCalled();
  });

  it("lists comments after verifying the work order exists", async () => {
    vi.mocked(workOrders.findById).mockResolvedValue(workOrder);
    vi.mocked(comments.listByWorkOrderId).mockResolvedValue([comment]);

    await expect(service.list(workOrderId)).resolves.toEqual([comment]);

    expect(workOrders.findById).toHaveBeenCalledWith(workOrderId);
    expect(comments.listByWorkOrderId).toHaveBeenCalledWith(workOrderId);
  });

  it("does not list comments when the work order does not exist", async () => {
    vi.mocked(workOrders.findById).mockResolvedValue(null);

    await expect(service.list(workOrderId)).rejects.toMatchObject({
      code: "WORK_ORDER_NOT_FOUND",
    });
    expect(comments.listByWorkOrderId).not.toHaveBeenCalled();
  });
});
