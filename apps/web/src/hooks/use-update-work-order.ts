import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UpdateWorkOrderRequest } from "@irruptive/shared";

import { updateWorkOrder } from "@/api/work-order";

export function useUpdateWorkOrder(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateWorkOrderRequest) => updateWorkOrder(id, input),
    onSuccess: async (response) => {
      queryClient.setQueryData(["work-orders", id], response);

      await queryClient.invalidateQueries({
        queryKey: ["work-orders"],
        predicate: (query) => typeof query.queryKey[1] !== "string",
      });
    },
  });
}
