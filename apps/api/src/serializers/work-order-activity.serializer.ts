import type { WorkOrderActivityItemResponse } from "@irruptive/shared";
import type { WorkOrderActivityItem } from "../services/work-order-activity-service.js";

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
