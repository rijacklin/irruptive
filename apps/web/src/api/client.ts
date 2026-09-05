import { z } from "zod";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const apiErrorBodySchema = z.object({
  error: z.object({
    message: z.string().trim().min(1),
  }),
});

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// HTTP errors need an explicit check: fetch only rejects transport failures.
export async function requestJson<T>(
  path: string,
  fallbackMessage: string,
  options: Pick<RequestInit, "method" | "body" | "signal"> & {
    headers?: Record<string, string>;
  } = {},
): Promise<T> {
  const response = await fetch(new URL(path, apiBaseUrl), {
    ...options,
    credentials: "include",
    headers: { Accept: "application/json", ...options.headers },
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const parsed = apiErrorBodySchema.safeParse(body);
    const message = parsed.success
      ? parsed.data.error.message
      : `${fallbackMessage} (${response.status}).`;

    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}
