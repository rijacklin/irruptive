import type { Pool } from "pg";

export interface Comment {
  id: string;
  workOrderId: string;
  userId: string;
  body: string;
  createdAt: Date;
}

export interface CreateCommentInput {
  workOrderId: string;
  userId: string;
  body: string;
}

interface CommentRow {
  id: string;
  work_order_id: string;
  user_id: string;
  body: string;
  created_at: Date;
}

const commentColumns = `
  id,
  work_order_id,
  user_id,
  body,
  created_at
`;

function mapCommentRow(row: CommentRow): Comment {
  return {
    id: row.id,
    workOrderId: row.work_order_id,
    userId: row.user_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

export class CommentRepository {
  constructor(private readonly pool: Pool) {}

  /**
   * Creates a comment.
   *
   * @param input - The data required to create a comment.
   * @returns The persisted comment.
   * @throws Error if the database does not return the persisted comment.
   */
  async create(input: CreateCommentInput): Promise<Comment> {
    const result = await this.pool.query<CommentRow>(
      `
        INSERT INTO comments (
          work_order_id,
          user_id,
          body
        )
        VALUES ($1, $2, $3)
        RETURNING ${commentColumns}
      `,
      [input.workOrderId, input.userId, input.body],
    );

    const row = result.rows[0];

    if (!row) {
      throw new Error("Comment insert did not return a row.");
    }

    return mapCommentRow(row);
  }

  /**
   * Lists comments associated with a given work order.
   *
   * @param workOrderId - The ID of the work order whose comments to retrieve.
   * @returns The list of comments on the work order.
   */
  async listByWorkOrderId(workOrderId: string): Promise<Comment[]> {
    const result = await this.pool.query<CommentRow>(
      `
        SELECT ${commentColumns}
        FROM comments
        WHERE work_order_id = $1
        ORDER BY created_at ASC, id ASC
      `,
      [workOrderId],
    );

    return result.rows.map(mapCommentRow);
  }
}
