import { useQuery } from "@tanstack/react-query";
import { listWorkOrderActivity } from "@/api/work-order-activity";

export const workOrderActivityQueryKey = (workOrderId: string) =>
  ["work-orders", workOrderId, "activity"] as const;

export function useWorkOrderActivity(workOrderId: string) {
  return useQuery({
    queryKey: workOrderActivityQueryKey(workOrderId),
    queryFn: ({ signal }) => listWorkOrderActivity(workOrderId, signal),
    enabled: workOrderId.length > 0,
  });
}
