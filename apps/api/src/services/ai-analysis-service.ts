import type {
  AIAnalysis,
  CreateAIAnalysisInput,
  WorkOrder,
} from "@irruptive/database";
import type { AuthorizationActor } from "../authorization/work-order-authorization.js";
import { canAccessWorkOrder } from "../authorization/work-order-authorization.js";
import {
  AIProviderOutputError,
  AIProviderRateLimitError,
  AIProviderTimeoutError,
  AIProviderUnavailableError,
  AIProviderUpstreamError,
  AuthorizationDeniedError,
  WorkOrderNotFoundError,
} from "../errors/application-error.js";
import {
  aiAnalysisSchema,
  AIProviderError,
  type AIProvider,
  workOrderAnalysisPromptVersion,
} from "../ai/ai-provider.js";

/**
 * Represents a narrowed work-order store contract for the methods AI analysis needs.
 */
export interface AIAnalysisWorkOrderStore {
  findById(id: string): Promise<WorkOrder | null>;
}

/**
 * Represents a contract for AIAnalysisRepository methods.
 */
export interface AIAnalysisStore {
  create(input: CreateAIAnalysisInput): Promise<AIAnalysis>;
  findLatestByWorkOrderId(workOrderId: string): Promise<AIAnalysis | null>;
}

/**
 * Helper method for restricting AI analysis to 'supervisor' and 'admin' roles.
 * NOTE: Technician role can still view stored AI analyses when viewing a work order.
 *
 * @param actor - The authenticated user requesting AI analysis.
 * @returns Whether user has the required role.
 */
export function canRequestAIAnalysis(actor: AuthorizationActor): boolean {
  return actor.role === "supervisor" || actor.role === "admin";
}

export class AIAnalysisService {
  constructor(
    private readonly workOrders: AIAnalysisWorkOrderStore,
    private readonly analyses: AIAnalysisStore,
    private readonly provider: AIProvider | null,
  ) {}

  /**
   * Retrieves the latest AI analysis for a given work order.
   *
   * @param actor - The authenticated user requesting AI analysis.
   * @param workOrderId - ID of associated work order.
   * @returns The latest AI analysis, or null if no AI analysis exists.
   */
  async getLatest(
    actor: AuthorizationActor,
    workOrderId: string,
  ): Promise<AIAnalysis | null> {
    const workOrder = await this.findAccessible(actor, workOrderId);
    return this.analyses.findLatestByWorkOrderId(workOrder.id);
  }

  /**
   * Generates an AI analysis for a given work order.
   *
   * @param actor - The authenticated user requesting AI analysis.
   * @param workOrderId - ID of associated work order.
   * @returns The generated AI analysis.
   */
  async generate(
    actor: AuthorizationActor,
    workOrderId: string,
  ): Promise<AIAnalysis> {
    const workOrder = await this.findAccessible(actor, workOrderId);

    if (!canRequestAIAnalysis(actor)) {
      throw new AuthorizationDeniedError();
    }

    if (!this.provider) {
      throw new AIProviderUnavailableError();
    }

    let result: unknown;
    try {
      result = await this.provider.analyzeWorkOrder({
        title: workOrder.title,
        description: workOrder.description,
      });
    } catch (error) {
      this.mapProviderError(error);
    }

    const analysis = aiAnalysisSchema.safeParse(result);
    if (!analysis.success) {
      throw new AIProviderOutputError();
    }

    return this.analyses.create({
      workOrderId: workOrder.id,
      provider: this.provider.provider,
      model: this.provider.model,
      promptVersion: workOrderAnalysisPromptVersion,
      ...analysis.data,
    });
  }

  /**
   * Retrieves a work order that both exists and is viewable by the user requesting AI analysis.
   *
   * @param actor - The authenticated user requesting AI analysis.
   * @param workOrderId - ID of associated work order.
   * @returns The accessible work order.
   */
  private async findAccessible(
    actor: AuthorizationActor,
    workOrderId: string,
  ): Promise<WorkOrder> {
    const workOrder = await this.workOrders.findById(workOrderId);

    if (!workOrder) {
      throw new WorkOrderNotFoundError(workOrderId);
    }

    if (!canAccessWorkOrder(actor, workOrder, "view")) {
      throw new AuthorizationDeniedError();
    }

    return workOrder;
  }

  /**
   * Maps AI provider error types to our api error types and throws the relevent error.
   * AIProviderUpstreamError serves as the default, catch-all error type.
   *
   * @param error - An unknown provider error type.
   * @returns Should never return a value, instead throwing the relevent error.
   */
  private mapProviderError(error: unknown): never {
    if (!(error instanceof AIProviderError)) {
      throw new AIProviderUpstreamError();
    }

    switch (error.kind) {
      case "timeout":
        throw new AIProviderTimeoutError();
      case "rate_limit":
        throw new AIProviderRateLimitError();
      case "invalid_output":
        throw new AIProviderOutputError();
      case "upstream":
        throw new AIProviderUpstreamError();
    }
  }
}
