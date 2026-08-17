import { z } from "zod";

const optionalEnvironmentValue = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    schema.optional(),
  );

const environmentSchema = z
  .object({
    API_HOST: z.string().default("0.0.0.0"),
    API_PORT: z.coerce.number().int().positive().max(65_535).default(3000),
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
    WEB_ORIGIN: z.url().default("http://localhost:5173"),
    AI_PROVIDER: optionalEnvironmentValue(z.literal("openai")),
    AI_MODEL: optionalEnvironmentValue(z.string().trim().min(1)),
    AI_API_KEY: optionalEnvironmentValue(z.string().trim().min(1)),
    AI_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  })
  .superRefine((environment, context) => {
    if (environment.AI_PROVIDER !== "openai") {
      return;
    }

    for (const field of ["AI_MODEL", "AI_API_KEY"] as const) {
      if (environment[field] === undefined) {
        context.addIssue({
          code: "custom",
          path: [field],
          message: `${field} is required when AI_PROVIDER=openai`,
        });
      }
    }
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
