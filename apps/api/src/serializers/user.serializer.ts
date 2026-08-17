import type { User } from "@irruptive/database";
import type { UserResponse } from "@irruptive/shared";

/**
 * Serializes a stored user record into its API response representation.
 *
 * @param user - Database model to serialize.
 * @returns The API response DTO.
 */
export function serializeUser(user: User): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}
