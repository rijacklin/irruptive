import type { UpdateWorkOrderInput, WorkOrder } from "@irruptive/database";
import type { UserRole, WorkOrderStatus } from "@irruptive/shared";

export interface AuthorizationActor {
  id: string;
  role: UserRole;
}

export type WorkOrderPermission =
  "view" | "comment" | "assign" | "reprioritize" | "edit_category" | "delete";

const technicianStatuses = new Set<WorkOrderStatus>([
  "in_progress",
  "blocked",
  "resolved",
]);

function hasElevatedAccess(actor: AuthorizationActor): boolean {
  return actor.role === "supervisor" || actor.role === "admin";
}

function isCreator(actor: AuthorizationActor, workOrder: WorkOrder): boolean {
  return actor.id === workOrder.createdBy;
}

function isAssignedTechnician(
  actor: AuthorizationActor,
  workOrder: WorkOrder,
): boolean {
  return actor.role === "technician" && actor.id === workOrder.assignedTo;
}

export function canCreateWorkOrder(actor: AuthorizationActor): boolean {
  return ["requester", "technician", "supervisor", "admin"].includes(
    actor.role,
  );
}

export function canAccessWorkOrder(
  actor: AuthorizationActor,
  workOrder: WorkOrder,
  permission: WorkOrderPermission,
): boolean {
  if (actor.role === "admin") {
    return true;
  }

  switch (permission) {
    case "view":
    case "comment":
      return (
        actor.role === "supervisor" ||
        (actor.role === "requester" && isCreator(actor, workOrder)) ||
        isAssignedTechnician(actor, workOrder)
      );
    case "assign":
    case "reprioritize":
    case "edit_category":
      return actor.role === "supervisor";
    case "delete":
      return false;
  }
}

export function canChangeWorkOrderStatus(
  actor: AuthorizationActor,
  workOrder: WorkOrder,
  nextStatus: WorkOrderStatus,
): boolean {
  if (hasElevatedAccess(actor)) {
    return true;
  }

  return (
    isAssignedTechnician(actor, workOrder) && technicianStatuses.has(nextStatus)
  );
}

export function canUpdateWorkOrder(
  actor: AuthorizationActor,
  workOrder: WorkOrder,
  input: UpdateWorkOrderInput,
): boolean {
  const checks: boolean[] = [];

  if (input.status !== undefined) {
    checks.push(canChangeWorkOrderStatus(actor, workOrder, input.status));
  }

  if (input.priority !== undefined) {
    checks.push(canAccessWorkOrder(actor, workOrder, "reprioritize"));
  }

  if (input.category !== undefined) {
    checks.push(canAccessWorkOrder(actor, workOrder, "edit_category"));
  }

  if (input.assignedTo !== undefined) {
    checks.push(canAccessWorkOrder(actor, workOrder, "assign"));
  }

  return checks.length > 0 && checks.every(Boolean);
}
