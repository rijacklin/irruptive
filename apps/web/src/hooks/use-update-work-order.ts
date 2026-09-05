import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateWorkOrderRequest } from "@irruptive/shared";

import { updateWorkOrder } from "@/api/work-order";
import { workOrderActivityQueryKey } from "@/hooks/use-work-order-activity";

export function useUpdateWorkOrder(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateWorkOrderRequest) => updateWorkOrder(id, input),
    onSuccess: async (response) => {
      queryClient.setQueryData(["work-orders", "detail", id], response);

      await queryClient.invalidateQueries({
        queryKey: ["work-orders", "list"],
      });

      await queryClient.invalidateQueries({
        queryKey: workOrderActivityQueryKey(id),
      });
    },
  });
}
