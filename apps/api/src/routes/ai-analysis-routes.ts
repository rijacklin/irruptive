import { Router } from "express";
import type { AIAnalysisService } from "../services/ai-analysis-service.js";
import { createAIAnalysisController } from "../controllers/ai-analysis-controller.js";
import { validate } from "../middleware/validate.js";
import { workOrderIdParamsSchema } from "../schemas/work-order.schemas.js";

/**
 * Exposes AI analysis generation and retrieval routes.
 */
export function createAIAnalysisRouter(service: AIAnalysisService) {
  const router = Router();
  const controller = createAIAnalysisController(service);

  router.post(
    "/:id/ai-analysis",
    validate({ params: workOrderIdParamsSchema }, controller.generate),
  );
  router.get(
    "/:id/ai-analysis",
    validate({ params: workOrderIdParamsSchema }, controller.getLatest),
  );

  return router;
}
