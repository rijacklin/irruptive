import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkOrderService, type WorkOrderStore } from "./work-order-service.js";

describe("WorkOrderService", () => {
  let repository: WorkOrderStore;
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

    service = new WorkOrderService(repository);
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
});
