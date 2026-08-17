import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AIAnalysis, WorkOrder } from "@irruptive/database";
import type { AuthorizationActor } from "../authorization/work-order-authorization.js";
import type { AIProvider } from "../ai/ai-provider.js";
import { AIProviderError } from "../ai/ai-provider.js";
import {
  AIAnalysisService,
  type AIAnalysisStore,
  type AIAnalysisWorkOrderStore,
} from "./ai-analysis-service.js";

const requester: AuthorizationActor = {
  id: "234173b3-13a5-43c8-baf7-bf06640cf7fd",
  role: "requester",
};
const supervisor: AuthorizationActor = {
  id: "55555555-5555-4555-8555-555555555555",
  role: "supervisor",
};
const workOrder: WorkOrder = {
  id: "6efd02fb-37ae-4685-b0c8-d7408afbf3b3",
  title: "Inspect conveyor",
  description: "Grinding noise before shutdown.",
  status: "open",
  priority: "medium",
  category: null,
  createdBy: requester.id,
  assignedTo: null,
  createdAt: new Date("2026-08-16T12:00:00.000Z"),
  updatedAt: new Date("2026-08-16T12:00:00.000Z"),
};
const stored: AIAnalysis = {
  id: "1f11c5bb-f8ad-4357-a2a8-68f6567711a8",
  workOrderId: workOrder.id,
  provider: "fake",
  model: "test-v1",
  promptVersion: "work-order-analysis-v1",
  summary: "Inspect the drive assembly.",
  suggestedPriority: "high",
  suggestedCategory: "Mechanical",
  suggestedActions: ["Inspect the bearing"],
  createdAt: new Date("2026-08-17T12:00:00.000Z"),
};

describe("AIAnalysisService", () => {
  let workOrders: AIAnalysisWorkOrderStore;
  let analyses: AIAnalysisStore;
  let provider: AIProvider;

  beforeEach(() => {
    workOrders = { findById: vi.fn().mockResolvedValue(workOrder) };
    analyses = {
      create: vi.fn().mockResolvedValue(stored),
      findLatestByWorkOrderId: vi.fn().mockResolvedValue(stored),
    };
    provider = {
      provider: "fake",
      model: "test-v1",
      analyzeWorkOrder: vi.fn().mockResolvedValue({
        summary: stored.summary,
        suggestedPriority: stored.suggestedPriority,
        suggestedCategory: stored.suggestedCategory,
        suggestedActions: stored.suggestedActions,
      }),
    };
  });

  it("passes only title and description and persists validated metadata", async () => {
    const before = structuredClone(workOrder);
    const service = new AIAnalysisService(workOrders, analyses, provider);

    await expect(service.generate(supervisor, workOrder.id)).resolves.toBe(
      stored,
    );

    expect(provider.analyzeWorkOrder).toHaveBeenCalledWith({
      title: workOrder.title,
      description: workOrder.description,
    });
    expect(analyses.create).toHaveBeenCalledWith({
      workOrderId: workOrder.id,
      provider: "fake",
      model: "test-v1",
      promptVersion: "work-order-analysis-v1",
      summary: stored.summary,
      suggestedPriority: stored.suggestedPriority,
      suggestedCategory: stored.suggestedCategory,
      suggestedActions: stored.suggestedActions,
    });
    expect(workOrder).toEqual(before);
  });

  it("allows viewers to read but not request paid analysis", async () => {
    const service = new AIAnalysisService(workOrders, analyses, provider);

    await expect(service.getLatest(requester, workOrder.id)).resolves.toBe(
      stored,
    );
    await expect(
      service.generate(requester, workOrder.id),
    ).rejects.toMatchObject({
      code: "AUTHORIZATION_DENIED",
    });
    expect(provider.analyzeWorkOrder).not.toHaveBeenCalled();
  });

  it("denies users who cannot view the work order", async () => {
    const service = new AIAnalysisService(workOrders, analyses, provider);
    const otherRequester = {
      ...requester,
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    };

    await expect(
      service.getLatest(otherRequester, workOrder.id),
    ).rejects.toMatchObject({
      code: "AUTHORIZATION_DENIED",
    });
    expect(analyses.findLatestByWorkOrderId).not.toHaveBeenCalled();
  });

  it("does not persist provider failures or malformed provider output", async () => {
    vi.mocked(provider.analyzeWorkOrder)
      .mockRejectedValueOnce(new AIProviderError("timeout", "timeout"))
      .mockResolvedValueOnce({ suggestedPriority: "urgent" } as never);
    const service = new AIAnalysisService(workOrders, analyses, provider);

    await expect(
      service.generate(supervisor, workOrder.id),
    ).rejects.toMatchObject({
      code: "AI_PROVIDER_TIMEOUT",
    });
    await expect(
      service.generate(supervisor, workOrder.id),
    ).rejects.toMatchObject({
      code: "AI_PROVIDER_INVALID_OUTPUT",
    });
    expect(analyses.create).not.toHaveBeenCalled();
  });

  it("handles missing work orders before calling the provider", async () => {
    vi.mocked(workOrders.findById).mockResolvedValue(null);
    const service = new AIAnalysisService(workOrders, analyses, provider);

    await expect(
      service.generate(supervisor, workOrder.id),
    ).rejects.toMatchObject({
      code: "WORK_ORDER_NOT_FOUND",
    });
    expect(provider.analyzeWorkOrder).not.toHaveBeenCalled();
  });

  it("returns service unavailable when no provider is configured", async () => {
    const service = new AIAnalysisService(workOrders, analyses, null);

    await expect(
      service.generate(supervisor, workOrder.id),
    ).rejects.toMatchObject({
      code: "AI_PROVIDER_UNAVAILABLE",
      status: 503,
    });
  });
});
