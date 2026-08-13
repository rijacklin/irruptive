import { z } from "zod";
import { workOrderPriorities } from "@irruptive/database";

export const createWorkOrderSchema = z
  .object({
    title: z.string().trim().min(3).max(200),
    description: z.string().trim().min(10),
    priority: z.enum(workOrderPriorities).optional(),
    category: z.string().trim().min(1).nullable().optional(),

    // TODO(auth): Remove this from the request body and derive it from the authenticated user
    createdBy: z.uuid(),
  })
  .strict();

export type CreateWorkOrderRequest = z.infer<typeof createWorkOrderSchema>;
