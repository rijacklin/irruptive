import type { Pool, PoolClient } from "pg";
import {
  workOrderActivityEventTypes,
  type WorkOrderActivityEventType,
} from "@irruptive/shared";

export const workOrderEventTypes = workOrderActivityEventTypes;

export type WorkOrderEventType = WorkOrderActivityEventType;

export interface WorkOrderEvent {
  id: string;
  workOrderId: string;
  eventType: WorkOrderEventType;
  eventData: Record<string, unknown>;
  createdAt: Date;
}

export interface CreateWorkOrderEventInput {
  workOrderId: string;
  eventType: WorkOrderEventType;
  eventData: Record<string, unknown>;
}

interface WorkOrderEventRow {
  id: string;
  work_order_id: string;
  event_type: WorkOrderEventType;
  event_data: Record<string, unknown>;
  created_at: Date;
}

type Queryable = Pick<Pool | PoolClient, "query">;

function mapWorkOrderEventRow(row: WorkOrderEventRow): WorkOrderEvent {
  return {
    id: row.id,
    workOrderId: row.work_order_id,
    eventType: row.event_type,
    eventData: row.event_data,
    createdAt: row.created_at,
  };
}

export class WorkOrderEventRepository {
  constructor(private readonly database: Queryable) {}

  async create(input: CreateWorkOrderEventInput): Promise<WorkOrderEvent> {
    const result = await this.database.query<WorkOrderEventRow>(
      `
        INSERT INTO work_order_events (
          work_order_id,
          event_type,
          event_data
        )
        VALUES ($1, $2, $3)
        RETURNING id, work_order_id, event_type, event_data, created_at
      `,
      [input.workOrderId, input.eventType, input.eventData],
    );

    const row = result.rows[0];

    if (!row) {
      throw new Error("Work-order event insert returned no row");
    }

    return mapWorkOrderEventRow(row);
  }

  async listByWorkOrderId(workOrderId: string): Promise<WorkOrderEvent[]> {
    const result = await this.database.query<WorkOrderEventRow>(
      `
        SELECT id, work_order_id, event_type, event_data, created_at
        FROM work_order_events
        WHERE work_order_id = $1
        ORDER BY created_at, id
      `,
      [workOrderId],
    );

    return result.rows.map(mapWorkOrderEventRow);
  }
}
