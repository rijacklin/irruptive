import type { User } from "@irruptive/database";
import type { UserResponse } from "@irruptive/shared";

export function serializeUser(user: User): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}
