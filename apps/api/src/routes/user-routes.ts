import { Router } from "express";
import type { UserService } from "../services/user-service.js";
import { createUserController } from "../controllers/user-controller.js";
import { validate } from "../middleware/validate.js";
import { listUsersQuerySchema } from "../schemas/user.schemas.js";

export function createUserRouter(service: UserService): Router {
  const router = Router();
  const controller = createUserController(service);

  router.get("/", validate({ query: listUsersQuerySchema }, controller.list));

  return router;
}
