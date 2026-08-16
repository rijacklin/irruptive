import type { Pool } from "pg";
import type { UserRole } from "@irruptive/shared";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export interface ListUsersInput {
  role?: UserRole;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: Date;
}

function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  };
}

export class UserRepository {
  constructor(private readonly pool: Pool) {}

  async findAssignableById(id: string): Promise<User | null> {
    const result = await this.pool.query<UserRow>(
      `
        SELECT id, name, email, role, created_at
        FROM users
        WHERE id = $1
          AND role = 'technician'
      `,
      [id],
    );

    const row = result.rows[0];
    return row ? mapUserRow(row) : null;
  }

  async list(input: ListUsersInput): Promise<User[]> {
    const result = await this.pool.query<UserRow>(
      `
        SELECT id, name, email, role, created_at
        FROM users
        WHERE ($1::text IS NULL OR role = $1)
        ORDER BY name, id
      `,
      [input.role ?? null],
    );

    return result.rows.map(mapUserRow);
  }
}
