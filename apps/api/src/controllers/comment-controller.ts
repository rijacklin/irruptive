import type { Request, Response } from "express";
import type { CreateCommentInput } from "@irruptive/database";
import type { CreateCommentRequest } from "../schemas/comment.schemas.js";
import type { CommentService } from "../services/comment-service.js";
import type { WorkOrderIdParams } from "../schemas/work-order.schemas.js";
import { serializeComment } from "../serializers/comment.serializer.js";

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
      _request: Request,
      response: Response,
    ) => {
      const input: CreateCommentInput = {
        workOrderId: params.id,
        userId: body.userId,
        body: body.body,
      };

      const comment = await service.create(input);

      response.status(201).json({
        data: serializeComment(comment),
      });
    },

    list: async (
      { params }: { params: WorkOrderIdParams },
      _request: Request,
      response: Response,
    ) => {
      const comments = await service.list(params.id);

      response.json({
        data: comments.map(serializeComment),
      });
    },
  };
}
