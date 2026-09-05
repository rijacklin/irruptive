import { retryQuery } from "./query-retry";
import { useQuery } from "@tanstack/react-query";
import { getWorkOrder } from "@/api/work-order";

export function useWorkOrder(id: string) {
  return useQuery({
    queryKey: ["work-orders", id],
    queryFn: ({ signal }) => getWorkOrder(id, signal),
    retry: retryQuery,
  });
}
