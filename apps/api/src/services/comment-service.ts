import type {
  Comment,
  CreateCommentInput,
  WorkOrder,
} from "@irruptive/database";
import { WorkOrderNotFoundError } from "../errors/application-error.js";

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

  private async ensureWorkOrderExists(workOrderId: string): Promise<void> {
    const workOrder = await this.workOrders.findById(workOrderId);
    if (!workOrder) {
      throw new WorkOrderNotFoundError(workOrderId);
    }
  }

  async create(input: CreateCommentInput): Promise<Comment> {
    await this.ensureWorkOrderExists(input.workOrderId);
    return this.comments.create(input);
  }

  async list(workOrderId: string): Promise<Comment[]> {
    await this.ensureWorkOrderExists(workOrderId);
    return this.comments.listByWorkOrderId(workOrderId);
  }
}
