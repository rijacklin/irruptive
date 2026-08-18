import type { Request, Response } from "express";
import type { WorkOrderIdParams } from "../schemas/work-order.schemas.js";
import type { WorkOrderActivityService } from "../services/work-order-activity-service.js";
import { serializeWorkOrderActivityItem } from "../serializers/work-order-activity.serializer.js";
import { getAuthenticatedActor } from "../middleware/require-authentication.js";

/**
 * Creates handlers for listing work-order activity.
 *
 * @param service - Application service used to list work-order activity.
 * @returns Controller handlers for work-order activity endpoints.
 */
export function createWorkOrderActivityController(
  service: WorkOrderActivityService,
) {
  return {
    list: async (
      { params }: { params: WorkOrderIdParams },
      request: Request,
      response: Response,
    ) => {
      const activity = await service.list(
        getAuthenticatedActor(request),
        params.id,
      );

      response.json({
        data: activity.map(serializeWorkOrderActivityItem),
      });
    },
  };
}
