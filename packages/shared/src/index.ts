export const applicationName = "Irruptive";

export interface HealthResponse {
  status: "ok";
}

export const userRoles = [
  "requester",
  "technician",
  "supervisor",
  "admin",
] as const;

export type UserRole = (typeof userRoles)[number];

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface ListUsersResponse {
  data: UserResponse[];
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

export interface CreateWorkOrderRequest {
  title: string;
  description: string;
  priority?: WorkOrderPriority;
  category?: string | null;
}

export interface CreateWorkOrderResponse {
  data: WorkOrderResponse;
}

export interface UpdateWorkOrderRequest {
  status?: WorkOrderStatus;
  priority?: WorkOrderPriority;
  assignedTo?: string | null;
}

export interface UpdateWorkOrderResponse {
  data: WorkOrderResponse;
}

export interface CommentResponse {
  id: string;
  workOrderId: string;
  userId: string;
  body: string;
  createdAt: string;
}

export interface ListCommentsResponse {
  data: CommentResponse[];
}

export interface CreateCommentRequest {
  body: string;
}

export interface CreateCommentResponse {
  data: CommentResponse;
}

export const workOrderActivityEventTypes = [
  "work_order_created",
  "status_changed",
  "priority_changed",
  "category_changed",
  "assignment_changed",
] as const;

export type WorkOrderActivityEventType =
  (typeof workOrderActivityEventTypes)[number];

export type WorkOrderActivityItemResponse =
  | {
      kind: "event";
      id: string;
      eventType: WorkOrderActivityEventType;
      eventData: Record<string, unknown>;
      createdAt: string;
    }
  | {
      kind: "comment";
      id: string;
      userId: string;
      body: string;
      createdAt: string;
    };

export interface ListWorkOrderActivityResponse {
  data: WorkOrderActivityItemResponse[];
}
