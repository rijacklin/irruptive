import { Router } from "express";
import type { WorkOrderService } from "../services/work-order-service.js";
import { createWorkOrderController } from "../controllers/work-order-controller.js";
import { validate } from "../middleware/validate.js";
import {
  createWorkOrderSchema,
  listWorkOrdersQuerySchema,
  updateWorkOrderSchema,
  workOrderIdParamsSchema,
} from "../schemas/work-order.schemas.js";

export function createWorkOrderRouter(service: WorkOrderService) {
  const router = Router();
  const controller = createWorkOrderController(service);

  router.post(
    "/",
    validate({ body: createWorkOrderSchema }, controller.create),
  );

  router.get(
    "/",
    validate({ query: listWorkOrdersQuerySchema }, controller.list),
  );

  router.get(
    "/:id",
    validate({ params: workOrderIdParamsSchema }, controller.getById),
  );

  router.patch(
    "/:id",
    validate(
      {
        params: workOrderIdParamsSchema,
        body: updateWorkOrderSchema,
      },
      controller.update,
    ),
  );

  router.delete(
    "/:id",
    validate({ params: workOrderIdParamsSchema }, controller.delete),
  );

  return router;
}
