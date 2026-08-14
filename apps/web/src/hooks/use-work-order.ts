import { useQuery } from "@tanstack/react-query";
import { getWorkOrder, WorkOrderApiError } from "@/api/work-order";

export function useWorkOrder(id: string) {
  return useQuery({
    queryKey: ["work-orders", id],
    queryFn: ({ signal }) => getWorkOrder(id, signal),
    retry: (failureCount, error) => {
      if (
        error instanceof WorkOrderApiError &&
        error.status >= 400 &&
        error.status < 500
      ) {
        return false;
      }

      return failureCount < 2;
    },
  });
}
