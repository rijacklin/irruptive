import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@irruptive/database";
import {
  WorkOrderService,
  type AssigneeStore,
  type WorkOrderStore,
} from "./work-order-service.js";

describe("WorkOrderService", () => {
  let repository: WorkOrderStore;
  let assignees: AssigneeStore;
  let service: WorkOrderService;

  const workOrderId = "6efd02fb-37ae-4685-b0c8-d7408afbf3b3";

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      findById: vi.fn(),
      list: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    assignees = {
      findAssignableById: vi.fn(),
    };

    service = new WorkOrderService(repository, assignees);
  });

  it("throws when a work order does not exist", async () => {
    vi.mocked(repository.findById).mockResolvedValue(null);

    await expect(service.getById(workOrderId)).rejects.toMatchObject({
      code: "WORK_ORDER_NOT_FOUND",
    });
  });

  it("throws when updating a missing work order", async () => {
    vi.mocked(repository.update).mockResolvedValue(null);

    await expect(
      service.update(workOrderId, { priority: "critical" }),
    ).rejects.toMatchObject({
      code: "WORK_ORDER_NOT_FOUND",
    });
  });

  it("throws when deleting a missing work order", async () => {
    vi.mocked(repository.delete).mockResolvedValue(false);

    await expect(service.delete(workOrderId)).rejects.toMatchObject({
      code: "WORK_ORDER_NOT_FOUND",
    });
  });

  it("rejects an ineligible assignee before updating", async () => {
    const assigneeId = "98bbd3ae-d7ab-46f4-b348-9f51b65fbadc";
    vi.mocked(assignees.findAssignableById).mockResolvedValue(null);

    await expect(
      service.update(workOrderId, { assignedTo: assigneeId }),
    ).rejects.toMatchObject({
      code: "ASSIGNEE_NOT_ELIGIBLE",
      status: 422,
    });
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("updates with an eligible technician", async () => {
    const technician: User = {
      id: "98bbd3ae-d7ab-46f4-b348-9f51b65fbadc",
      name: "Alex Technician",
      email: "alex@example.com",
      role: "technician",
      createdAt: new Date("2026-08-16T12:00:00.000Z"),
    };
    vi.mocked(assignees.findAssignableById).mockResolvedValue(technician);
    vi.mocked(repository.update).mockResolvedValue({
      id: workOrderId,
      title: "Inspect conveyor",
      description: "Inspect the conveyor drive assembly.",
      status: "open",
      priority: "medium",
      category: null,
      createdBy: "234173b3-13a5-43c8-baf7-bf06640cf7fd",
      assignedTo: technician.id,
      createdAt: new Date("2026-08-16T12:00:00.000Z"),
      updatedAt: new Date("2026-08-16T12:05:00.000Z"),
    });

    await service.update(workOrderId, { assignedTo: technician.id });

    expect(repository.update).toHaveBeenCalledWith(workOrderId, {
      assignedTo: technician.id,
    });
  });
});
