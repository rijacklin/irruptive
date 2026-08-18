import type { Comment, WorkOrder, WorkOrderEvent } from "@irruptive/database";
import {
  AuthorizationDeniedError,
  WorkOrderNotFoundError,
} from "../errors/application-error.js";
import {
  canAccessWorkOrder,
  type AuthorizationActor,
} from "../authorization/work-order-authorization.js";

export type WorkOrderActivityItem =
  | { kind: "event"; event: WorkOrderEvent }
  | { kind: "comment"; comment: Comment };

export interface ActivityWorkOrderStore {
  findById(id: string): Promise<WorkOrder | null>;
}

export interface ActivityCommentStore {
  listByWorkOrderId(workOrderId: string): Promise<Comment[]>;
}

export interface ActivityEventStore {
  listByWorkOrderId(workOrderId: string): Promise<WorkOrderEvent[]>;
}

export class WorkOrderActivityService {
  constructor(
    private readonly workOrders: ActivityWorkOrderStore,
    private readonly comments: ActivityCommentStore,
    private readonly events: ActivityEventStore,
  ) {}

  /**
   * Lists activity items associated with a work order.
   *
   * @param actor - The authenticated user requesting the activity.
   * @param workOrderId - The ID of the work order whose activity to retrieve.
   * @returns The activity items associated with the work order.
   * @throws {@link WorkOrderNotFoundError} If the work order does not exist.
   * @throws {@link AuthorizationDeniedError} If the user is not authorized to view the work order.
   */
  async list(
    actor: AuthorizationActor,
    workOrderId: string,
  ): Promise<WorkOrderActivityItem[]> {
    const workOrder = await this.workOrders.findById(workOrderId);

    if (!workOrder) {
      throw new WorkOrderNotFoundError(workOrderId);
    }

    if (!canAccessWorkOrder(actor, workOrder, "view")) {
      throw new AuthorizationDeniedError();
    }

    const [comments, events] = await Promise.all([
      this.comments.listByWorkOrderId(workOrderId),
      this.events.listByWorkOrderId(workOrderId),
    ]);

    return [
      ...comments.map((comment) => ({ kind: "comment" as const, comment })),
      ...events.map((event) => ({ kind: "event" as const, event })),
    ].sort((left, right) => {
      const leftItem = left.kind === "comment" ? left.comment : left.event;
      const rightItem = right.kind === "comment" ? right.comment : right.event;
      const timestampDifference =
        leftItem.createdAt.getTime() - rightItem.createdAt.getTime();

      return timestampDifference || leftItem.id.localeCompare(rightItem.id);
    });
  }
}
