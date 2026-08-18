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
  ) { }

  /**
   * Creates a work order for an authorized user.
   *
   * @param actor - The authenticated user creating the work order.
   * @param input - The work-order data, excluding the creator ID derived from the authenticated user.
   * @returns The persisted work order.
   * @throws {@link AuthorizationDeniedError} If the user is not authorized to create a work order.
   */
  async create(
    actor: AuthorizationActor,
    input: Omit<CreateWorkOrderInput, "createdBy">,
  ): Promise<WorkOrder> {
    if (!canCreateWorkOrder(actor)) {
      throw new AuthorizationDeniedError();
    }

    return this.workOrders.create({ ...input, createdBy: actor.id });
  }

  /**
   * Finds a work order by ID, requiring it to exist. 
   *
   * @param id - ID of associated work order.
   * @returns The requested work order.
   * @throws {@link WorkOrderNotFoundError} If the work order cannot be found.
   */
  private async findRequired(id: string): Promise<WorkOrder> {
    const workOrder = await this.workOrders.findById(id);

    if (!workOrder) {
      throw new WorkOrderNotFoundError(id);
    }

    return workOrder;
  }

  /**
   * Retrieves a work order that the authenticated user is authorized to view.
   *
   * @param actor - The authenticated user requesting the work order.
   * @param id - ID of associated work order.
   * @returns The requested work order.
   * @throws {@link WorkOrderNotFoundError} If the work order does not exist.
   * @throws {@link AuthorizationDeniedError} If the user is not authorized to view the work order.
   */
  async getById(actor: AuthorizationActor, id: string): Promise<WorkOrder> {
    const workOrder = await this.findRequired(id);

    if (!canAccessWorkOrder(actor, workOrder, "view")) {
      throw new AuthorizationDeniedError();
    }

    return workOrder;
  }

  /**
   * Lists work orders the user is authorized to view.
   *
   * @param actor - The authenticated user requesting the work orders.
   * @param input - The filtering, sorting, and pagination options.
   * @returns The work orders visible to the user.
   */
  async list(
    actor: AuthorizationActor,
    input: ListWorkOrdersInput,
  ): Promise<WorkOrder[]> {
    return this.workOrders.list({ ...input, ...getWorkOrderListScope(actor) });
  }

  /**
   * Updates a work order the user is authorized to modify.
   *
   * @param actor - The authenticated user updating the work order.
   * @param id - The ID of the work order to update.
   * @param input - The work-order fields to update.
   * @returns The updated work order.
   * @throws {@link WorkOrderNotFoundError} If the work order does not exist.
   * @throws {@link AuthorizationDeniedError} If the user is not authorized to update the work order.
   * @throws {@link AssigneeNotEligibleError} If the selected assignee is not an eligible technician.
   */
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

  /**
   * Deletes a work order the user is authorized to delete.
   *
   * @param actor - The authenticated user deleting the work order.
   * @param id - The ID of the work order to delete.
   * @returns A promise that resolves when the work order has been deleted.
   * @throws {@link WorkOrderNotFoundError} If the work order does not exist.
   * @throws {@link AuthorizationDeniedError} If the user is not authorized to delete the work order.
   */
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
