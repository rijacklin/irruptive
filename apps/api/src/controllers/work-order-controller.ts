import type { Request, Response } from "express";
import type { WorkOrderService } from "../services/work-order-service.js";
import { serializeWorkOrder } from "../serializers/work-order.serializer.js";
import type {
  CreateWorkOrderInput,
  UpdateWorkOrderInput,
} from "@irruptive/database";
import type {
  CreateWorkOrderRequest,
  ListWorkOrdersRequest,
  UpdateWorkOrderRequest,
  WorkOrderIdParams,
} from "../schemas/work-order.schemas.js";
import { getAuthenticatedActor } from "../middleware/require-authentication.js";

export function createWorkOrderController(service: WorkOrderService) {
  return {
    create: async (
      { body }: { body: CreateWorkOrderRequest },
      request: Request,
      response: Response,
    ) => {
      const actor = getAuthenticatedActor(request);
      const input: Omit<CreateWorkOrderInput, "createdBy"> = {
        title: body.title,
        description: body.description,
        ...(body.priority !== undefined ? { priority: body.priority } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
      };

      const workOrder = await service.create(actor, input);

      response.status(201).json({
        data: serializeWorkOrder(workOrder),
      });
    },

    getById: async (
      { params }: { params: WorkOrderIdParams },
      request: Request,
      response: Response,
    ) => {
      const workOrder = await service.getById(
        getAuthenticatedActor(request),
        params.id,
      );

      response.json({
        data: serializeWorkOrder(workOrder),
      });
    },

    list: async (
      { query }: { query: ListWorkOrdersRequest },
      request: Request,
      response: Response,
    ) => {
      const workOrders = await service.list(
        getAuthenticatedActor(request),
        query,
      );

      response.json({
        data: workOrders.map(serializeWorkOrder),
        pagination: query,
      });
    },

    update: async (
      {
        params,
        body,
      }: {
        params: WorkOrderIdParams;
        body: UpdateWorkOrderRequest;
      },
      request: Request,
      response: Response,
    ) => {
      const input: UpdateWorkOrderInput = {
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.priority !== undefined ? { priority: body.priority } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
        ...(body.assignedTo !== undefined
          ? { assignedTo: body.assignedTo }
          : {}),
      };

      const workOrder = await service.update(
        getAuthenticatedActor(request),
        params.id,
        input,
      );

      response.json({
        data: serializeWorkOrder(workOrder),
      });
    },

    delete: async (
      { params }: { params: WorkOrderIdParams },
      request: Request,
      response: Response,
    ) => {
      await service.delete(getAuthenticatedActor(request), params.id);
      response.status(204).send();
    },
  };
}
