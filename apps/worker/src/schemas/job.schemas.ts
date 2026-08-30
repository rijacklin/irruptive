import { z } from "zod";

export const aiAnalysisJobMessageSchema = z
  .object({
    version: z.literal(1),
    jobId: z.uuid(),
  })
  .strict();

export type AiAnalysisJobMessageSchema = z.infer<
  typeof aiAnalysisJobMessageSchema
>;
