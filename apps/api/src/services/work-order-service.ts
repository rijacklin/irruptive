import type {
  CreateWorkOrderInput,
  ListWorkOrdersInput,
  UpdateWorkOrderInput,
  WorkOrder,
} from "@irruptive/database";
import type { User } from "@irruptive/database";
import {
  AssigneeNotEligibleError,
  WorkOrderNotFoundError,
} from "../errors/application-error.js";

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

  async create(input: CreateWorkOrderInput): Promise<WorkOrder> {
    return this.workOrders.create(input);
  }

  async getById(id: string): Promise<WorkOrder> {
    const workOrder = await this.workOrders.findById(id);

    if (!workOrder) {
      throw new WorkOrderNotFoundError(id);
    }

    return workOrder;
  }

  async list(input: ListWorkOrdersInput): Promise<WorkOrder[]> {
    return this.workOrders.list(input);
  }

  async update(id: string, input: UpdateWorkOrderInput): Promise<WorkOrder> {
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

  async delete(id: string): Promise<void> {
    const deleted = await this.workOrders.delete(id);

    if (!deleted) {
      throw new WorkOrderNotFoundError(id);
    }
  }
}
