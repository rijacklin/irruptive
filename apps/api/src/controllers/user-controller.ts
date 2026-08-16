import type { Request, Response } from "express";
import type { UserService } from "../services/user-service.js";
import type { ListUsersRequest } from "../schemas/user.schemas.js";
import { serializeUser } from "../serializers/user.serializer.js";
import { getAuthenticatedActor } from "../middleware/require-authentication.js";

export function createUserController(service: UserService) {
  return {
    list: async (
      { query }: { query: ListUsersRequest },
      request: Request,
      response: Response,
    ) => {
      const users = await service.list(getAuthenticatedActor(request), {
        ...(query.role !== undefined ? { role: query.role } : {}),
      });

      response.json({
        data: users.map(serializeUser),
      });
    },
  };
}
