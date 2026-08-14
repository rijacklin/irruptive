import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listWorkOrders, type ListWorkOrdersParams } from "@/api/work-order";

export function useWorkOrders(params: ListWorkOrdersParams) {
  return useQuery({
    queryKey: ["work-orders", params],
    queryFn: ({ signal }) => listWorkOrders(params, signal),
    placeholderData: keepPreviousData,
  });
}
