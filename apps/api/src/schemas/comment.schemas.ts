import { z } from "zod";

export const createCommentSchema = z
  .object({
    // TODO(auth): Remove when derived from the authenticated user.
    userId: z.uuid(),
    body: z.string().trim().min(1),
  })
  .strict();

export type CreateCommentRequest = z.infer<typeof createCommentSchema>;
