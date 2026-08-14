import type {
  CreateWorkOrderInput,
  ListWorkOrdersInput,
  UpdateWorkOrderInput,
  WorkOrder,
} from "@irruptive/database";
import { WorkOrderNotFoundError } from "../errors/application-error.js";

export interface WorkOrderStore {
  create(input: CreateWorkOrderInput): Promise<WorkOrder>;
  findById(id: string): Promise<WorkOrder | null>;
  list(input: ListWorkOrdersInput): Promise<WorkOrder[]>;
  update(id: string, input: UpdateWorkOrderInput): Promise<WorkOrder | null>;
  delete(id: string): Promise<boolean>;
}

export class WorkOrderService {
  constructor(private readonly workOrders: WorkOrderStore) {}

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
