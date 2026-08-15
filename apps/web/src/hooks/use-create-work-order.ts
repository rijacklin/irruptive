import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateWorkOrderRequest } from "@irruptive/shared";

import { createWorkOrder } from "@/api/work-order";

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWorkOrderRequest) => createWorkOrder(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["work-orders"],
      });
    },
  });
}
