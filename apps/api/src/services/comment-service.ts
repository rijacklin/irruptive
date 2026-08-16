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
  constructor(
    private readonly comments: CommentStore,
    private readonly workOrders: WorkOrderLookup,
  ) {}

  private async findWorkOrder(workOrderId: string): Promise<WorkOrder> {
    const workOrder = await this.workOrders.findById(workOrderId);
    if (!workOrder) {
      throw new WorkOrderNotFoundError(workOrderId);
    }

    return workOrder;
  }

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
