import type { ListUsersInput, User } from "@irruptive/database";

export interface UserListStore {
  list(input: ListUsersInput): Promise<User[]>;
}

export class UserService {
  constructor(private readonly users: UserListStore) {}

  async list(input: ListUsersInput): Promise<User[]> {
    return this.users.list(input);
  }
}
