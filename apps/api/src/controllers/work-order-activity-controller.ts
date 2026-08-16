import type { Request, Response } from "express";
import type { WorkOrderIdParams } from "../schemas/work-order.schemas.js";
import type { WorkOrderActivityService } from "../services/work-order-activity-service.js";
import { serializeWorkOrderActivityItem } from "../serializers/work-order-activity.serializer.js";

export function createWorkOrderActivityController(
  service: WorkOrderActivityService,
) {
  return {
    list: async (
      { params }: { params: WorkOrderIdParams },
      _request: Request,
      response: Response,
    ) => {
      const activity = await service.list(params.id);

      response.json({
        data: activity.map(serializeWorkOrderActivityItem),
      });
    },
  };
}
