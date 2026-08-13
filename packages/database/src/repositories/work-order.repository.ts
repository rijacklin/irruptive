import type { Pool } from "pg";

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

export interface LastWorkOrdersInput {
  limit: number;
  offset: number;
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

  async create(input: CreateWorkOrderInput): Promise<WorkOrder> {
    const result = await this.pool.query<WorkOrderRow>(
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

    return mapWorkOrderRow(row);
  }

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

  async list(input: LastWorkOrdersInput): Promise<WorkOrder[]> {
    const result = await this.pool.query<WorkOrderRow>(
      `
        SELECT ${workOrderColumns}
        FROM work_orders
        ORDER BY created_at DESC, id DESC
        LIMIT $1
        OFFSET $2
      `,
      [input.limit, input.offset],
    );

    return result.rows.map(mapWorkOrderRow);
  }
}
