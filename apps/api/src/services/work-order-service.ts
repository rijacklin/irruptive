import type {
  CreateWorkOrderInput,
  ListWorkOrdersInput,
  UpdateWorkOrderInput,
  WorkOrder,
} from "@irruptive/database";
import type { User } from "@irruptive/database";
import {
  AssigneeNotEligibleError,
  AuthorizationDeniedError,
  WorkOrderNotFoundError,
} from "../errors/application-error.js";
import {
  canAccessWorkOrder,
  canCreateWorkOrder,
  canUpdateWorkOrder,
  getWorkOrderListScope,
  type AuthorizationActor,
} from "../authorization/work-order-authorization.js";

export interface WorkOrderStore {
  create(input: CreateWorkOrderInput): Promise<WorkOrder>;
  findById(id: string): Promise<WorkOrder | null>;
  list(input: ListWorkOrdersInput): Promise<WorkOrder[]>;
  update(id: string, input: UpdateWorkOrderInput): Promise<WorkOrder | null>;
  delete(id: string): Promise<boolean>;
}

export interface AssigneeStore {
  findAssignableById(id: string): Promise<User | null>;
}

export class WorkOrderService {
  constructor(
    private readonly workOrders: WorkOrderStore,
    private readonly assignees: AssigneeStore,
  ) {}

  async create(
    actor: AuthorizationActor,
    input: Omit<CreateWorkOrderInput, "createdBy">,
  ): Promise<WorkOrder> {
    if (!canCreateWorkOrder(actor)) {
      throw new AuthorizationDeniedError();
    }

    return this.workOrders.create({ ...input, createdBy: actor.id });
  }

  private async findRequired(id: string): Promise<WorkOrder> {
    const workOrder = await this.workOrders.findById(id);

    if (!workOrder) {
      throw new WorkOrderNotFoundError(id);
    }

    return workOrder;
  }

  async getById(actor: AuthorizationActor, id: string): Promise<WorkOrder> {
    const workOrder = await this.findRequired(id);

    if (!canAccessWorkOrder(actor, workOrder, "view")) {
      throw new AuthorizationDeniedError();
    }

    return workOrder;
  }

  async list(
    actor: AuthorizationActor,
    input: ListWorkOrdersInput,
  ): Promise<WorkOrder[]> {
    return this.workOrders.list({ ...input, ...getWorkOrderListScope(actor) });
  }

  async update(
    actor: AuthorizationActor,
    id: string,
    input: UpdateWorkOrderInput,
  ): Promise<WorkOrder> {
    const existing = await this.findRequired(id);

    if (!canUpdateWorkOrder(actor, existing, input)) {
      throw new AuthorizationDeniedError();
    }

    if (input.assignedTo) {
      const assignee = await this.assignees.findAssignableById(
        input.assignedTo,
      );

      if (!assignee) {
        throw new AssigneeNotEligibleError(input.assignedTo);
      }
    }

    const workOrder = await this.workOrders.update(id, input);

    if (!workOrder) {
      throw new WorkOrderNotFoundError(id);
    }

    return workOrder;
  }

  async delete(actor: AuthorizationActor, id: string): Promise<void> {
    const existing = await this.findRequired(id);

    if (!canAccessWorkOrder(actor, existing, "delete")) {
      throw new AuthorizationDeniedError();
    }

    const deleted = await this.workOrders.delete(id);

    if (!deleted) {
      throw new WorkOrderNotFoundError(id);
    }
  }
}
