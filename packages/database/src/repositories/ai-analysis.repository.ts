import type { Pool } from "pg";
import type { WorkOrderPriority } from "@irruptive/shared";

export interface AIAnalysis {
  id: string;
  workOrderId: string;
  provider: string;
  model: string;
  promptVersion: string;
  summary: string;
  suggestedPriority: WorkOrderPriority | null;
  suggestedCategory: string | null;
  suggestedActions: string[];
  createdAt: Date;
}

export interface CreateAIAnalysisInput {
  workOrderId: string;
  provider: string;
  model: string;
  promptVersion: string;
  summary: string;
  suggestedPriority: WorkOrderPriority | null;
  suggestedCategory: string | null;
  suggestedActions: string[];
}

interface AIAnalysisRow {
  id: string;
  work_order_id: string;
  provider: string;
  model: string;
  prompt_version: string;
  summary: string;
  suggested_priority: WorkOrderPriority | null;
  suggested_category: string | null;
  suggested_actions: string[];
  created_at: Date;
}

const columns = `
  id,
  work_order_id,
  provider,
  model,
  prompt_version,
  summary,
  suggested_priority,
  suggested_category,
  suggested_actions,
  created_at
`;

function mapRow(row: AIAnalysisRow): AIAnalysis {
  return {
    id: row.id,
    workOrderId: row.work_order_id,
    provider: row.provider,
    model: row.model,
    promptVersion: row.prompt_version,
    summary: row.summary,
    suggestedPriority: row.suggested_priority,
    suggestedCategory: row.suggested_category,
    suggestedActions: row.suggested_actions,
    createdAt: row.created_at,
  };
}

export class AIAnalysisRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: CreateAIAnalysisInput): Promise<AIAnalysis> {
    const result = await this.pool.query<AIAnalysisRow>(
      `
        INSERT INTO ai_analyses (
          work_order_id,
          provider,
          model,
          prompt_version,
          summary,
          suggested_priority,
          suggested_category,
          suggested_actions
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
        RETURNING ${columns}
      `,
      [
        input.workOrderId,
        input.provider,
        input.model,
        input.promptVersion,
        input.summary,
        input.suggestedPriority,
        input.suggestedCategory,
        JSON.stringify(input.suggestedActions),
      ],
    );
    const row = result.rows[0];

    if (!row) {
      throw new Error("AI analysis insert returned no row");
    }

    return mapRow(row);
  }

  async findLatestByWorkOrderId(
    workOrderId: string,
  ): Promise<AIAnalysis | null> {
    const result = await this.pool.query<AIAnalysisRow>(
      `
        SELECT ${columns}
        FROM ai_analyses
        WHERE work_order_id = $1
        ORDER BY created_at DESC, id DESC
        LIMIT 1
      `,
      [workOrderId],
    );
    const row = result.rows[0];
    return row ? mapRow(row) : null;
  }
}
