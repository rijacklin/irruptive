import type { Request, Response } from "express";
import type { CreateCommentInput } from "@irruptive/database";
import type { CreateCommentRequest } from "../schemas/comment.schemas.js";
import type { CommentService } from "../services/comment-service.js";
import type { WorkOrderIdParams } from "../schemas/work-order.schemas.js";
import { serializeComment } from "../serializers/comment.serializer.js";
import { getAuthenticatedActor } from "../middleware/require-authentication.js";

export function createCommentController(service: CommentService) {
  return {
    create: async (
      {
        params,
        body,
      }: {
        params: WorkOrderIdParams;
        body: CreateCommentRequest;
      },
      request: Request,
      response: Response,
    ) => {
      const actor = getAuthenticatedActor(request);
      const input: Omit<CreateCommentInput, "userId"> = {
        workOrderId: params.id,
        body: body.body,
      };

      const comment = await service.create(actor, input);

      response.status(201).json({
        data: serializeComment(comment),
      });
    },

    list: async (
      { params }: { params: WorkOrderIdParams },
      request: Request,
      response: Response,
    ) => {
      const comments = await service.list(
        getAuthenticatedActor(request),
        params.id,
      );

      response.json({
        data: comments.map(serializeComment),
      });
    },
  };
}
