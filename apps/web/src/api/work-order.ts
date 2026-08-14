import type {
  GetWorkOrderResponse,
  ListWorkOrdersResponse,
} from "@irruptive/shared";

export interface ListWorkOrdersParams {
  limit: number;
  offset: number;
}

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function listWorkOrders(
  params: ListWorkOrdersParams,
  signal?: AbortSignal,
): Promise<ListWorkOrdersResponse> {
  const url = new URL("/api/work-orders", apiBaseUrl);

  url.searchParams.set("limit", String(params.limit));
  url.searchParams.set("offset", String(params.offset));

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    ...(signal !== undefined ? { signal } : {}),
  });

  if (!response.ok) {
    throw new Error(`Unable to load work orders (${response.status}).`);
  }

  return (await response.json()) as ListWorkOrdersResponse;
}

export class WorkOrderApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "WorkOrderApiError";
  }
}

export async function getWorkOrder(
  id: string,
  signal?: AbortSignal,
): Promise<GetWorkOrderResponse> {
  const url = new URL(`/api/work-orders/${encodeURIComponent(id)}`, apiBaseUrl);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    ...(signal !== undefined ? { signal } : {}),
  });

  if (!response.ok) {
    throw new WorkOrderApiError(
      `Unable to load work order (${response.status}).`,
      response.status,
    );
  }

  return (await response.json()) as GetWorkOrderResponse;
}
