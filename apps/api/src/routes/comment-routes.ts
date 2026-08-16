import { Router } from "express";
import { createCommentController } from "../controllers/comment-controller.js";
import { validate } from "../middleware/validate.js";
import { createCommentSchema } from "../schemas/comment.schemas.js";
import { workOrderIdParamsSchema } from "../schemas/work-order.schemas.js";
import type { CommentService } from "../services/comment-service.js";

export function createCommentRouter(service: CommentService) {
  const router = Router();
  const controller = createCommentController(service);

  router.post(
    "/:id/comments",
    validate(
      {
        params: workOrderIdParamsSchema,
        body: createCommentSchema,
      },
      controller.create,
    ),
  );

  router.get(
    "/:id/comments",
    validate({ params: workOrderIdParamsSchema }, controller.list),
  );

  return router;
}
