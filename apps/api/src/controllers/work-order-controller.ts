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

export function createWorkOrderController(service: WorkOrderService) {
  return {
    create: async (
      { body }: { body: CreateWorkOrderRequest },
      _request: Request,
      response: Response,
    ) => {
      const input: CreateWorkOrderInput = {
        title: body.title,
        description: body.description,
        createdBy: body.createdBy,
        ...(body.priority !== undefined ? { priority: body.priority } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
      };

      const workOrder = await service.create(input);

      response.status(201).json({
        data: serializeWorkOrder(workOrder),
      });
    },

    getById: async (
      { params }: { params: WorkOrderIdParams },
      _request: Request,
      response: Response,
    ) => {
      const workOrder = await service.getById(params.id);

      response.json({
        data: serializeWorkOrder(workOrder),
      });
    },

    list: async (
      { query }: { query: ListWorkOrdersRequest },
      _request: Request,
      response: Response,
    ) => {
      const workOrders = await service.list(query);

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
      _request: Request,
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

      const workOrder = await service.update(params.id, input);

      response.json({
        data: serializeWorkOrder(workOrder),
      });
    },

    delete: async (
      { params }: { params: WorkOrderIdParams },
      _request: Request,
      response: Response,
    ) => {
      await service.delete(params.id);
      response.status(204).send();
    },
  };
}
