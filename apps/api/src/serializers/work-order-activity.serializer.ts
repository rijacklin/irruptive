import type { WorkOrderActivityItemResponse } from "@irruptive/shared";
import type { WorkOrderActivityItem } from "../services/work-order-activity-service.js";

/**
 * Serializes a stored work order activity record into its API response representation.
 *
 * @param item - Database model to serialize.
 * @returns The API response DTO.
 */
export function serializeWorkOrderActivityItem(
  item: WorkOrderActivityItem,
): WorkOrderActivityItemResponse {
  if (item.kind === "comment") {
    return {
      kind: "comment",
      id: item.comment.id,
      userId: item.comment.userId,
      body: item.comment.body,
      createdAt: item.comment.createdAt.toISOString(),
    };
  }

  return {
    kind: "event",
    id: item.event.id,
    eventType: item.event.eventType,
    eventData: item.event.eventData,
    createdAt: item.event.createdAt.toISOString(),
  };
}
