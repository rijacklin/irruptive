import { z } from "zod";
import { userRoles } from "@irruptive/shared";

export const listUsersQuerySchema = z
  .object({
    role: z.enum(userRoles).optional(),
  })
  .strict();

export type ListUsersRequest = z.infer<typeof listUsersQuerySchema>;
