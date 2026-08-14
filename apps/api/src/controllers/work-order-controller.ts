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
      _request: Request<Record<string, never>, unknown, CreateWorkOrderRequest>,
      response: Response,
    ) => {
      const body = response.locals.validated.body as CreateWorkOrderRequest;
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
      _request: Request<WorkOrderIdParams>,
      response: Response,
    ) => {
      const params = response.locals.validated.params as WorkOrderIdParams;
      const workOrder = await service.getById(params.id);

      response.json({
        data: serializeWorkOrder(workOrder),
      });
    },

    list: async (_request: Request, response: Response) => {
      const input = response.locals.validated.query as ListWorkOrdersRequest;
      const workOrders = await service.list(input);

      response.json({
        data: workOrders.map(serializeWorkOrder),
        pagination: input,
      });
    },

    update: async (
      _request: Request<WorkOrderIdParams, unknown, UpdateWorkOrderRequest>,
      response: Response,
    ) => {
      const params = response.locals.validated.params as WorkOrderIdParams;
      const body = response.locals.validated.body as UpdateWorkOrderRequest;
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
      _request: Request<WorkOrderIdParams>,
      response: Response,
    ) => {
      const params = response.locals.validated.params as WorkOrderIdParams;

      await service.delete(params.id);
      response.status(204).send();
    },
  };
}
