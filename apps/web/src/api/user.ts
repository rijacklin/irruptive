import type { ListUsersResponse, UserRole } from "@irruptive/shared";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function listUsers(
  role: UserRole,
  signal?: AbortSignal,
): Promise<ListUsersResponse> {
  const url = new URL("/api/users", apiBaseUrl);
  url.searchParams.set("role", role);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    ...(signal !== undefined ? { signal } : {}),
  });

  if (!response.ok) {
    throw new Error(`Unable to load users (${response.status}).`);
  }

  return (await response.json()) as ListUsersResponse;
}
