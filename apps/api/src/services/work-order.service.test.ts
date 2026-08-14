import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreateWorkOrderInput, WorkOrder } from "@irruptive/database";
import { WorkOrderService, type WorkOrderStore } from "./work-order-service.js";

describe("WorkOrderService", () => {
  let repository: WorkOrderStore;
  let service: WorkOrderService;

  const workOrder: WorkOrder = {
    id: "6efd02fb-37ae-4685-b0c8-d7408afbf3b3",
    title: "Conveyor intermittently stopping",
    description: "Operator reports grinding before shutdown.",
    status: "open",
    priority: "high",
    category: "Mechanical",
    createdBy: "234173b3-13a5-43c8-baf7-bf06640cf7fd",
    assignedTo: null,
    createdAt: new Date("2026-08-13T12:00:00.000Z"),
    updatedAt: new Date("2026-08-13T12:00:00.000Z"),
  };

  beforeEach(() => {
    repository = {
      create: vi.fn(),
      findById: vi.fn(),
      list: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    service = new WorkOrderService(repository);
  });

  it("creates a work order", async () => {
    const input: CreateWorkOrderInput = {
      title: workOrder.title,
      description: workOrder.description,
      priority: workOrder.priority,
      category: workOrder.category,
      createdBy: workOrder.createdBy,
    };

    vi.mocked(repository.create).mockResolvedValue(workOrder);

    await expect(service.create(input)).resolves.toEqual(workOrder);
    expect(repository.create).toHaveBeenCalledWith(input);
    expect(repository.create).toHaveBeenCalledOnce();
  });

  it("gets an existing work order by id", async () => {
    vi.mocked(repository.findById).mockResolvedValue(workOrder);

    await expect(service.getById(workOrder.id)).resolves.toEqual(workOrder);

    expect(repository.findById).toHaveBeenCalledWith(workOrder.id);
    expect(repository.findById).toHaveBeenCalledOnce();
  });

  it("throws when a work order does not exist", async () => {
    vi.mocked(repository.findById).mockResolvedValue(null);

    await expect(
      service.getById("6efd02fb-37ae-4685-b0c8-d7408afbf3b3"),
    ).rejects.toMatchObject({
      code: "WORK_ORDER_NOT_FOUND",
    });
  });

  it("lists work orders using the requested pagination", async () => {
    const pagination = {
      limit: 20,
      offset: 0,
    };

    vi.mocked(repository.list).mockResolvedValue([workOrder]);

    await expect(service.list(pagination)).resolves.toEqual([workOrder]);

    expect(repository.list).toHaveBeenCalledWith(pagination);
    expect(repository.list).toHaveBeenCalledOnce();
  });

  it("updates the priority of an existing work order", async () => {
    const input = { priority: "critical" } as const;
    const updated = {
      ...workOrder,
      priority: "critical",
    } as const;

    vi.mocked(repository.update).mockResolvedValue(updated);

    await expect(service.update(workOrder.id, input)).resolves.toEqual(updated);

    expect(repository.update).toHaveBeenCalledWith(workOrder.id, input);
  });

  it("throws when updating a missing work order", async () => {
    vi.mocked(repository.update).mockResolvedValue(null);

    await expect(
      service.update(workOrder.id, { priority: "critical" }),
    ).rejects.toMatchObject({
      code: "WORK_ORDER_NOT_FOUND",
    });
  });

  it("deletes an existing work order", async () => {
    vi.mocked(repository.delete).mockResolvedValue(true);

    await expect(service.delete(workOrder.id)).resolves.toBeUndefined();
    expect(repository.delete).toHaveBeenCalledWith(workOrder.id);
  });

  it("throws when deleting a missing work order", async () => {
    vi.mocked(repository.delete).mockResolvedValue(false);

    await expect(service.delete(workOrder.id)).rejects.toMatchObject({
      code: "WORK_ORDER_NOT_FOUND",
    });
  });
});
