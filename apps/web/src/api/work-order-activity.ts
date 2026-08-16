import type { ListWorkOrderActivityResponse } from "@irruptive/shared";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function listWorkOrderActivity(
  workOrderId: string,
  signal?: AbortSignal,
): Promise<ListWorkOrderActivityResponse> {
  const url = new URL(
    `/api/work-orders/${encodeURIComponent(workOrderId)}/activity`,
    apiBaseUrl,
  );

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    ...(signal !== undefined ? { signal } : {}),
  });

  if (!response.ok) {
    throw new Error(`Unable to load activity (${response.status}).`);
  }

  return (await response.json()) as ListWorkOrderActivityResponse;
}
