import type { WorkOrder } from "@irruptive/database";
import type { WorkOrderResponse } from "@irruptive/shared";

/**
 * Serializes a stored work order record into its API response representation.
 *
 * @param workOrder - Database model to serialize.
 * @returns The API response DTO.
 */
export function serializeWorkOrder(workOrder: WorkOrder): WorkOrderResponse {
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
