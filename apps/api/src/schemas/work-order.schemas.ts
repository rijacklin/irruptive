import { z } from "zod";
import { workOrderPriorities, workOrderStatuses } from "@irruptive/shared";

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

export const workOrderIdParamsSchema = z.object({
  id: z.uuid(),
});

export type WorkOrderIdParams = z.infer<typeof workOrderIdParamsSchema>;

export const listWorkOrdersQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .strict();

export type ListWorkOrdersRequest = z.infer<typeof listWorkOrdersQuerySchema>;

export const updateWorkOrderSchema = z
  .object({
    status: z.enum(workOrderStatuses).optional(),
    priority: z.enum(workOrderPriorities).optional(),
    category: z.string().trim().min(1).nullable().optional(),
    assignedTo: z.uuid().nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be supplied.",
  });

export type UpdateWorkOrderRequest = z.infer<typeof updateWorkOrderSchema>;
