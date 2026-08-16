import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User, WorkOrder } from "@irruptive/database";
import type { AuthorizationActor } from "../authorization/work-order-authorization.js";
import {
  WorkOrderService,
  type AssigneeStore,
  type WorkOrderStore,
} from "./work-order-service.js";

describe("WorkOrderService", () => {
  let repository: WorkOrderStore;
  let assignees: AssigneeStore;
  let service: WorkOrderService;

  const requester: AuthorizationActor = {
    id: "234173b3-13a5-43c8-baf7-bf06640cf7fd",
    role: "requester",
  };
  const supervisor: AuthorizationActor = {
    id: "55555555-5555-4555-8555-555555555555",
    role: "supervisor",
  };
  const admin: AuthorizationActor = {
    id: "66666666-6666-4666-8666-666666666666",
    role: "admin",
  };
  const workOrder: WorkOrder = {
    id: "6efd02fb-37ae-4685-b0c8-d7408afbf3b3",
    title: "Inspect conveyor",
    description: "Inspect the conveyor drive assembly.",
    status: "open",
    priority: "medium",
    category: null,
    createdBy: requester.id,
    assignedTo: null,
    createdAt: new Date("2026-08-16T12:00:00.000Z"),
    updatedAt: new Date("2026-08-16T12:00:00.000Z"),
  };

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      findById: vi.fn(),
      list: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    assignees = { findAssignableById: vi.fn() };
    service = new WorkOrderService(repository, assignees);
  });

  it("throws when a work order does not exist", async () => {
    vi.mocked(repository.findById).mockResolvedValue(null);

    await expect(service.getById(admin, workOrder.id)).rejects.toMatchObject({
      code: "WORK_ORDER_NOT_FOUND",
    });
  });

  it("derives the creator from the authorized actor", async () => {
    vi.mocked(repository.create).mockResolvedValue(workOrder);

    await service.create(requester, {
      title: workOrder.title,
      description: workOrder.description,
    });

    expect(repository.create).toHaveBeenCalledWith({
      title: workOrder.title,
      description: workOrder.description,
      createdBy: requester.id,
    });
  });

  it("scopes requester and technician lists at the repository boundary", async () => {
    vi.mocked(repository.list).mockResolvedValue([]);

    await service.list(requester, { limit: 20, offset: 0 });
    await service.list(
      { id: "22222222-2222-4222-8222-222222222222", role: "technician" },
      { limit: 10, offset: 5 },
    );

    expect(repository.list).toHaveBeenNthCalledWith(1, {
      limit: 20,
      offset: 0,
      createdBy: requester.id,
    });
    expect(repository.list).toHaveBeenNthCalledWith(2, {
      limit: 10,
      offset: 5,
      assignedTo: "22222222-2222-4222-8222-222222222222",
    });
  });

  it("does not scope supervisor lists", async () => {
    vi.mocked(repository.list).mockResolvedValue([]);

    await service.list(supervisor, { limit: 20, offset: 0 });

    expect(repository.list).toHaveBeenCalledWith({ limit: 20, offset: 0 });
  });

  it("rejects a requester reprioritizing a work order", async () => {
    vi.mocked(repository.findById).mockResolvedValue(workOrder);

    await expect(
      service.update(requester, workOrder.id, { priority: "critical" }),
    ).rejects.toMatchObject({ code: "AUTHORIZATION_DENIED", status: 403 });
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("throws when updating a missing work order", async () => {
    vi.mocked(repository.findById).mockResolvedValue(null);

    await expect(
      service.update(admin, workOrder.id, { priority: "critical" }),
    ).rejects.toMatchObject({ code: "WORK_ORDER_NOT_FOUND" });
  });

  it("rejects an ineligible assignee before updating", async () => {
    const assigneeId = "98bbd3ae-d7ab-46f4-b348-9f51b65fbadc";
    vi.mocked(repository.findById).mockResolvedValue(workOrder);
    vi.mocked(assignees.findAssignableById).mockResolvedValue(null);

    await expect(
      service.update(supervisor, workOrder.id, { assignedTo: assigneeId }),
    ).rejects.toMatchObject({ code: "ASSIGNEE_NOT_ELIGIBLE", status: 422 });
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
    vi.mocked(repository.findById).mockResolvedValue(workOrder);
    vi.mocked(assignees.findAssignableById).mockResolvedValue(technician);
    vi.mocked(repository.update).mockResolvedValue({
      ...workOrder,
      assignedTo: technician.id,
    });

    await service.update(supervisor, workOrder.id, {
      assignedTo: technician.id,
    });

    expect(repository.update).toHaveBeenCalledWith(workOrder.id, {
      assignedTo: technician.id,
    });
  });

  it("only permits administrators to delete work orders", async () => {
    vi.mocked(repository.findById).mockResolvedValue(workOrder);
    vi.mocked(repository.delete).mockResolvedValue(true);

    await expect(
      service.delete(supervisor, workOrder.id),
    ).rejects.toMatchObject({ code: "AUTHORIZATION_DENIED" });
    await expect(service.delete(admin, workOrder.id)).resolves.toBeUndefined();
    expect(repository.delete).toHaveBeenCalledOnce();
  });
});
