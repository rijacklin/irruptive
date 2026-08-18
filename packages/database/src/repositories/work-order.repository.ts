import type { Pool, PoolClient } from "pg";
import type { WorkOrderPriority, WorkOrderStatus } from "@irruptive/shared";
import {
  WorkOrderEventRepository,
  type WorkOrderEventType,
} from "./work-order-event.repository.js";

export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  category: string | null;
  createdBy: string;
  assignedTo: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWorkOrderInput {
  title: string;
  description: string;
  priority?: WorkOrderPriority;
  category?: string | null;
  createdBy: string;
  assignedTo?: string | null;
}

export interface ListWorkOrdersInput {
  limit: number;
  offset: number;
  createdBy?: string;
  assignedTo?: string;
}

export interface UpdateWorkOrderInput {
  status?: WorkOrderStatus;
  priority?: WorkOrderPriority;
  category?: string | null;
  assignedTo?: string | null;
}

interface WorkOrderRow {
  id: string;
  title: string;
  description: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  category: string | null;
  created_by: string;
  assigned_to: string | null;
  created_at: Date;
  updated_at: Date;
}

const workOrderColumns = `
  id,
  title,
  description,
  status,
  priority,
  category,
  created_by,
  assigned_to,
  created_at,
  updated_at
`;

function mapWorkOrderRow(row: WorkOrderRow): WorkOrder {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    category: row.category,
    createdBy: row.created_by,
    assignedTo: row.assigned_to,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class WorkOrderRepository {
  constructor(private readonly pool: Pool) {}

  /**
   * Creates a work order and associtaed event in the database.
   *
   * @param input - The data required to create a work order.
   * @returns The persisted work order.
   * @throws Error if the database does not reutrn the persisted work order.
   */
  async create(input: CreateWorkOrderInput): Promise<WorkOrder> {
    return this.withTransaction(async (client) => {
      const result = await client.query<WorkOrderRow>(
        `
          INSERT INTO work_orders (
            title,
            description,
            priority,
            category,
            created_by,
            assigned_to
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING ${workOrderColumns}
        `,
        [
          input.title,
          input.description,
          input.priority ?? "medium",
          input.category ?? null,
          input.createdBy,
          input.assignedTo ?? null,
        ],
      );

      const row = result.rows[0];

      if (!row) {
        throw new Error("Work order insert returned no row");
      }

      const workOrder = mapWorkOrderRow(row);
      const events = new WorkOrderEventRepository(client);

      await events.create({
        workOrderId: workOrder.id,
        eventType: "work_order_created",
        eventData: {
          title: workOrder.title,
          description: workOrder.description,
          status: workOrder.status,
          priority: workOrder.priority,
          category: workOrder.category,
          createdBy: workOrder.createdBy,
          assignedTo: workOrder.assignedTo,
        },
      });

      return workOrder;
    });
  }

  /**
   * Returns the requested work order from the database.
   *
   * @param id - Work order identifier.
   * @returns The requested work order, or null if that work order doesn't exist.
   */
  async findById(id: string): Promise<WorkOrder | null> {
    const result = await this.pool.query<WorkOrderRow>(
      `
        SELECT ${workOrderColumns}
        FROM work_orders
        WHERE id = $1
      `,
      [id],
    );

    const row = result.rows[0];
    return row ? mapWorkOrderRow(row) : null;
  }

  /**
   * Returns a paginated list of work orders.
   *
   * @param input - Structured input for listing work orders.
   * @returns The list of work orders.
   */
  async list(input: ListWorkOrdersInput): Promise<WorkOrder[]> {
    const result = await this.pool.query<WorkOrderRow>(
      `
        SELECT ${workOrderColumns}
        FROM work_orders
        WHERE ($3::uuid IS NULL OR created_by = $3)
          AND ($4::uuid IS NULL OR assigned_to = $4)
        ORDER BY created_at DESC, id DESC
        LIMIT $1
        OFFSET $2
      `,
      [
        input.limit,
        input.offset,
        input.createdBy ?? null,
        input.assignedTo ?? null,
      ],
    );

    return result.rows.map(mapWorkOrderRow);
  }

  /**
   * Updates fields on an existing work order and records change events for altered fields.
   * Field changes and associated events all occur in a single database transaction.
   *
   * @param id - Work order identifier.
   * @param input - Structured input for updating a work order.
   * @returns The updated work order, or null if work order does not exist.
   * @throws Error if no updated fields are provided.
   */
  async update(
    id: string,
    input: UpdateWorkOrderInput,
  ): Promise<WorkOrder | null> {
    const assignments: string[] = [];
    const values: unknown[] = [id];

    const addAssignment = (column: string, value: unknown) => {
      values.push(value);
      assignments.push(`${column} = $${values.length}`);
    };

    if (input.status !== undefined) {
      addAssignment("status", input.status);
    }

    if (input.priority !== undefined) {
      addAssignment("priority", input.priority);
    }

    if (input.category !== undefined) {
      addAssignment("category", input.category);
    }

    if (input.assignedTo !== undefined) {
      addAssignment("assigned_to", input.assignedTo);
    }

    if (assignments.length === 0) {
      throw new Error("Update requires at least one field");
    }

    return this.withTransaction(async (client) => {
      const existingResult = await client.query<WorkOrderRow>(
        `
          SELECT ${workOrderColumns}
          FROM work_orders
          WHERE id = $1
          FOR UPDATE
        `,
        [id],
      );
      const existingRow = existingResult.rows[0];

      if (!existingRow) {
        return null;
      }

      const existing = mapWorkOrderRow(existingRow);
      const result = await client.query<WorkOrderRow>(
        `
          UPDATE work_orders
          SET
            ${assignments.join(",\n")},
            updated_at = now()
          WHERE id = $1
          RETURNING ${workOrderColumns}
        `,
        values,
      );
      const row = result.rows[0];

      if (!row) {
        throw new Error("Work order update returned no row");
      }

      const updated = mapWorkOrderRow(row);
      const events = new WorkOrderEventRepository(client);
      const changes: Array<{
        eventType: WorkOrderEventType;
        previous: unknown;
        current: unknown;
      }> = [
        {
          eventType: "status_changed",
          previous: existing.status,
          current: updated.status,
        },
        {
          eventType: "priority_changed",
          previous: existing.priority,
          current: updated.priority,
        },
        {
          eventType: "category_changed",
          previous: existing.category,
          current: updated.category,
        },
        {
          eventType: "assignment_changed",
          previous: existing.assignedTo,
          current: updated.assignedTo,
        },
      ];

      for (const change of changes) {
        if (change.previous === change.current) {
          continue;
        }

        await events.create({
          workOrderId: id,
          eventType: change.eventType,
          eventData: {
            previous: change.previous,
            current: change.current,
          },
        });
      }

      return updated;
    });
  }

  /**
   * Deletes a work order from the database.
   *
   * @param id - Work order identifier.
   * @returns True if a work order was deleted, false if none existed with that id.
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.pool.query(
      `
        DELETE FROM work_orders
        WHERE id = $1
      `,
      [id],
    );

    return result.rowCount === 1;
  }

  /**
   * Runs the given operation within a single database transaction.
   *
   * @param operation - The asynchronous operation to execute using the transaction client.
   * @returns The value returned by the operation after the transaction commits successfully.
   * @throws The original error if the operation or commit fails, after attempting to roll back the transaction.
   */
  private async withTransaction<T>(
    operation: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");
      const result = await operation(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
