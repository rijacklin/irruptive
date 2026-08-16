import { describe, expect, it } from "vitest";
import type { WorkOrder } from "@irruptive/database";
import type { UserRole } from "@irruptive/shared";
import {
  canAccessWorkOrder,
  canChangeWorkOrderStatus,
  canCreateWorkOrder,
  canUpdateWorkOrder,
  type AuthorizationActor,
} from "./work-order-authorization.js";

const requesterId = "11111111-1111-4111-8111-111111111111";
const technicianId = "22222222-2222-4222-8222-222222222222";

const workOrder: WorkOrder = {
  id: "6efd02fb-37ae-4685-b0c8-d7408afbf3b3",
  title: "Inspect conveyor",
  description: "Inspect the conveyor drive assembly.",
  status: "assigned",
  priority: "medium",
  category: null,
  createdBy: requesterId,
  assignedTo: technicianId,
  createdAt: new Date("2026-08-16T12:00:00.000Z"),
  updatedAt: new Date("2026-08-16T12:00:00.000Z"),
};

function actor(id: string, role: UserRole): AuthorizationActor {
  return { id, role };
}

describe("work-order authorization", () => {
  it.each<UserRole>(["requester", "technician", "supervisor", "admin"])(
    "allows a %s to create a work order",
    (role) => {
      expect(canCreateWorkOrder(actor(requesterId, role))).toBe(true);
    },
  );

  it("limits requester access to work orders they created", () => {
    const creator = actor(requesterId, "requester");
    const unrelatedRequester = actor(
      "33333333-3333-4333-8333-333333333333",
      "requester",
    );

    expect(canAccessWorkOrder(creator, workOrder, "view")).toBe(true);
    expect(canAccessWorkOrder(creator, workOrder, "comment")).toBe(true);
    expect(canAccessWorkOrder(unrelatedRequester, workOrder, "view")).toBe(
      false,
    );
  });

  it("limits technician access to assigned work orders", () => {
    const assigned = actor(technicianId, "technician");
    const unassigned = actor(
      "44444444-4444-4444-8444-444444444444",
      "technician",
    );

    expect(canAccessWorkOrder(assigned, workOrder, "view")).toBe(true);
    expect(canAccessWorkOrder(assigned, workOrder, "comment")).toBe(true);
    expect(canAccessWorkOrder(unassigned, workOrder, "view")).toBe(false);
    expect(
      canAccessWorkOrder(actor(requesterId, "technician"), workOrder, "view"),
    ).toBe(false);
  });

  it("allows supervisors to assign and reprioritize", () => {
    const supervisor = actor(
      "55555555-5555-4555-8555-555555555555",
      "supervisor",
    );

    expect(canAccessWorkOrder(supervisor, workOrder, "assign")).toBe(true);
    expect(canAccessWorkOrder(supervisor, workOrder, "reprioritize")).toBe(
      true,
    );
    expect(canAccessWorkOrder(supervisor, workOrder, "delete")).toBe(false);
  });

  it("grants administrators every work-order permission", () => {
    const admin = actor("66666666-6666-4666-8666-666666666666", "admin");

    expect(canAccessWorkOrder(admin, workOrder, "view")).toBe(true);
    expect(canAccessWorkOrder(admin, workOrder, "assign")).toBe(true);
    expect(canAccessWorkOrder(admin, workOrder, "delete")).toBe(true);
  });

  it("allows assigned technicians to progress, block, and resolve work", () => {
    const technician = actor(technicianId, "technician");

    expect(canChangeWorkOrderStatus(technician, workOrder, "in_progress")).toBe(
      true,
    );
    expect(canChangeWorkOrderStatus(technician, workOrder, "blocked")).toBe(
      true,
    );
    expect(canChangeWorkOrderStatus(technician, workOrder, "resolved")).toBe(
      true,
    );
    expect(canChangeWorkOrderStatus(technician, workOrder, "closed")).toBe(
      false,
    );
  });

  it("rejects a mixed update when any field is unauthorized", () => {
    const technician = actor(technicianId, "technician");

    expect(
      canUpdateWorkOrder(technician, workOrder, {
        status: "in_progress",
        priority: "critical",
      }),
    ).toBe(false);
  });

  it("allows supervisors to update managed work-order fields", () => {
    const supervisor = actor(
      "55555555-5555-4555-8555-555555555555",
      "supervisor",
    );

    expect(
      canUpdateWorkOrder(supervisor, workOrder, {
        status: "closed",
        priority: "high",
        category: "Mechanical",
        assignedTo: null,
      }),
    ).toBe(true);
  });

  it("rejects an empty update", () => {
    expect(
      canUpdateWorkOrder(actor(technicianId, "technician"), workOrder, {}),
    ).toBe(false);
  });
});
