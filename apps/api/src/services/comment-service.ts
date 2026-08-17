import type {
  Comment,
  CreateCommentInput,
  WorkOrder,
} from "@irruptive/database";
import {
  AuthorizationDeniedError,
  WorkOrderNotFoundError,
} from "../errors/application-error.js";
import {
  canAccessWorkOrder,
  type AuthorizationActor,
} from "../authorization/work-order-authorization.js";

export interface CommentStore {
  create(input: CreateCommentInput): Promise<Comment>;
  listByWorkOrderId(workOrderId: string): Promise<Comment[]>;
}

export interface WorkOrderLookup {
  findById(id: string): Promise<WorkOrder | null>;
}

export class CommentService {
  /**
   * Creates a comment service.
   *
   * @param comments - Store used to persist and retrieve comments.
   * @param workOrders - Lookup used to load work orders for authorization.
   */
  constructor(
    private readonly comments: CommentStore,
    private readonly workOrders: WorkOrderLookup,
  ) { }

  /**
   * Loads a work order by ID.
   *
   * @param workOrderId - ID of the work order to load.
   * @returns The matching work order.
   * @throws {@link WorkOrderNotFoundError} If the work order does not exist.
   */
  private async findWorkOrder(workOrderId: string): Promise<WorkOrder> {
    const workOrder = await this.workOrders.findById(workOrderId);
    if (!workOrder) {
      throw new WorkOrderNotFoundError(workOrderId);
    }

    return workOrder;
  }

  /**
   * Creates a comment on a work order that the actor may comment on.
   *
   * @param actor - The authenticated user creating the comment.
   * @param input - The work-order ID and comment body.
   * @returns The persisted comment.
   * @throws {@link WorkOrderNotFoundError} If the work order does not exist.
   * @throws {@link AuthorizationDeniedError} If the actor may not comment on the work order.
   */
  async create(
    actor: AuthorizationActor,
    input: Omit<CreateCommentInput, "userId">,
  ): Promise<Comment> {
    const workOrder = await this.findWorkOrder(input.workOrderId);
    if (!canAccessWorkOrder(actor, workOrder, "comment")) {
      throw new AuthorizationDeniedError();
    }

    return this.comments.create({ ...input, userId: actor.id });
  }

  /**
   * Lists comments on a work order that the actor may view.
   *
   * @param actor - The authenticated user viewing the comments.
   * @param workOrderId - ID of associated work order.
   * @returns The work order's comments.
   * @throws {@link WorkOrderNotFoundError} If the work order does not exist.
   * @throws {@link AuthorizationDeniedError} If the actor may not view the work order.
   */
  async list(
    actor: AuthorizationActor,
    workOrderId: string,
  ): Promise<Comment[]> {
    const workOrder = await this.findWorkOrder(workOrderId);
    if (!canAccessWorkOrder(actor, workOrder, "view")) {
      throw new AuthorizationDeniedError();
    }

    return this.comments.listByWorkOrderId(workOrderId);
  }
}
