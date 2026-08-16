import { useQuery } from "@tanstack/react-query";
import type { UserRole } from "@irruptive/shared";
import { listUsers } from "@/api/user";

export function useUsers(role: UserRole) {
  return useQuery({
    queryKey: ["users", { role }],
    queryFn: ({ signal }) => listUsers(role, signal),
  });
}
