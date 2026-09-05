import type {
  CreateWorkOrderRequest,
  CreateWorkOrderResponse,
  GetWorkOrderResponse,
  ListWorkOrdersResponse,
  UpdateWorkOrderRequest,
  UpdateWorkOrderResponse,
} from "@irruptive/shared";
import { requestJson } from "./client";

export interface ListWorkOrdersParams {
  limit: number;
  offset: number;
}
export function listWorkOrders(
  params: ListWorkOrdersParams,
  signal?: AbortSignal,
): Promise<ListWorkOrdersResponse> {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });
  return requestJson(
    `/api/work-orders?${query}`,
    "Unable to load work orders",
    { ...(signal !== undefined ? { signal } : {}) },
  );
}
export function getWorkOrder(
  id: string,
  signal?: AbortSignal,
): Promise<GetWorkOrderResponse> {
  return requestJson(
    `/api/work-orders/${encodeURIComponent(id)}`,
    "Unable to load work order",
    { ...(signal !== undefined ? { signal } : {}) },
  );
}
export function createWorkOrder(
  input: CreateWorkOrderRequest,
): Promise<CreateWorkOrderResponse> {
  return requestJson("/api/work-orders", "Unable to create work order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
export function updateWorkOrder(
  id: string,
  input: UpdateWorkOrderRequest,
): Promise<UpdateWorkOrderResponse> {
  return requestJson(
    `/api/work-orders/${encodeURIComponent(id)}`,
    "Unable to update work order",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}
