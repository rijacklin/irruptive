import { Router } from "express";
import { createWorkOrderActivityController } from "../controllers/work-order-activity-controller.js";
import { validate } from "../middleware/validate.js";
import { workOrderIdParamsSchema } from "../schemas/work-order.schemas.js";
import type { WorkOrderActivityService } from "../services/work-order-activity-service.js";

export function createWorkOrderActivityRouter(
  service: WorkOrderActivityService,
): Router {
  const router = Router();
  const controller = createWorkOrderActivityController(service);

  router.get(
    "/:id/activity",
    validate({ params: workOrderIdParamsSchema }, controller.list),
  );

  return router;
}
