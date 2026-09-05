import type { ListUsersResponse, UserRole } from "@irruptive/shared";
import { requestJson } from "./client";

export function listUsers(
  role: UserRole,
  signal?: AbortSignal,
): Promise<ListUsersResponse> {
  const query = new URLSearchParams({ role });
  return requestJson(`/api/users?${query}`, "Unable to load users", {
    ...(signal !== undefined ? { signal } : {}),
  });
}
