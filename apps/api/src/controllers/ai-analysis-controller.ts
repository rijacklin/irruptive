import type { Request, Response } from "express";
import type { WorkOrderIdParams } from "../schemas/work-order.schemas.js";
import type { AIAnalysisService } from "../services/ai-analysis-service.js";
import { getAuthenticatedActor } from "../middleware/require-authentication.js";
import { serializeAIAnalysis } from "../serializers/ai-analysis.serializer.js";

/**
 * Creates handlers for generating/retrieving AI analyses.
 *
 * @param service - Application service used to generate/retrieve analyses.
 * @returns Controller handlers for AI analysis endpoints.
 */
export function createAIAnalysisController(service: AIAnalysisService) {
  return {
    generate: async (
      { params }: { params: WorkOrderIdParams },
      request: Request,
      response: Response,
    ) => {
      const analysis = await service.generate(
        getAuthenticatedActor(request),
        params.id,
      );
      response.status(201).json({ data: serializeAIAnalysis(analysis) });
    },

    getLatest: async (
      { params }: { params: WorkOrderIdParams },
      request: Request,
      response: Response,
    ) => {
      const analysis = await service.getLatest(
        getAuthenticatedActor(request),
        params.id,
      );
      response.json({
        data: analysis ? serializeAIAnalysis(analysis) : null,
      });
    },
  };
}
