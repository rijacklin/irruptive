import type { Request, Response } from "express";
import type { UserService } from "../services/user-service.js";
import type { ListUsersRequest } from "../schemas/user.schemas.js";
import { serializeUser } from "../serializers/user.serializer.js";

export function createUserController(service: UserService) {
  return {
    list: async (
      { query }: { query: ListUsersRequest },
      _request: Request,
      response: Response,
    ) => {
      const users = await service.list({
        ...(query.role !== undefined ? { role: query.role } : {}),
      });

      response.json({
        data: users.map(serializeUser),
      });
    },
  };
}
