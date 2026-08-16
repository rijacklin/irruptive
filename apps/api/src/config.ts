import { z } from "zod";

const environmentSchema = z.object({
  API_HOST: z.string().default("0.0.0.0"),
  API_PORT: z.coerce.number().int().positive().max(65_535).default(3000),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
  WEB_ORIGIN: z.url().default("http://localhost:5173"),
});

export type Environment = z.infer<typeof environmentSchema>;

// todo: more custom error types; integrate modern Zed4 custom errors
export class EnvironmentConfigurationError extends Error {
  constructor(public readonly issues: z.core.$ZodIssue[]) {
    super("Invalid environment configuration");
    this.name = "EnvironmentConfigurationError";
  }
}

export function loadEnvironment(
  source: NodeJS.ProcessEnv = process.env,
): Environment {
  const result = environmentSchema.safeParse(source);

  if (!result.success) {
    throw new EnvironmentConfigurationError(result.error.issues);
  }

  return result.data;
}
