import type { WorkOrder } from "@irruptive/database";

export function serializeWorkOrder(workOrder: WorkOrder) {
  return {
    id: workOrder.id,
    title: workOrder.title,
    description: workOrder.description,
    status: workOrder.status,
    priority: workOrder.priority,
    category: workOrder.category,
    createdBy: workOrder.createdBy,
    assignedTo: workOrder.assignedTo,
    createdAt: workOrder.createdAt.toISOString(),
    updatedAt: workOrder.updatedAt.toISOString(),
  };
}
