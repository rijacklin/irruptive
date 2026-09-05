import type { ListWorkOrderActivityResponse } from "@irruptive/shared";
import { requestJson } from "./client";

export function listWorkOrderActivity(
  workOrderId: string,
  signal?: AbortSignal,
): Promise<ListWorkOrderActivityResponse> {
  return requestJson(
    `/api/work-orders/${encodeURIComponent(workOrderId)}/activity`,
    "Unable to load activity",
    { ...(signal !== undefined ? { signal } : {}) },
  );
}
