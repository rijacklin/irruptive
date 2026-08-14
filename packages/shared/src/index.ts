export const applicationName = "Irruptive";

export interface HealthResponse {
  status: "ok";
}

export const workOrderStatuses = [
  "open",
  "assigned",
  "in_progress",
  "blocked",
  "resolved",
  "closed",
] as const;

export type WorkOrderStatus = (typeof workOrderStatuses)[number];

export const workOrderPriorities = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

export type WorkOrderPriority = (typeof workOrderPriorities)[number];

export interface WorkOrderResponse {
  id: string;
  title: string;
  description: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  category: string | null;
  createdBy: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListWorkOrdersResponse {
  data: WorkOrderResponse[];
  pagination: {
    limit: number;
    offset: number;
  };
}

export interface GetWorkOrderResponse {
  data: WorkOrderResponse;
}
