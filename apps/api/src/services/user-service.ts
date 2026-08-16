import type { ListUsersInput, User } from "@irruptive/database";
import { AuthorizationDeniedError } from "../errors/application-error.js";
import {
  canListUsers,
  type AuthorizationActor,
} from "../authorization/work-order-authorization.js";

export interface UserListStore {
  list(input: ListUsersInput): Promise<User[]>;
}

export class UserService {
  constructor(private readonly users: UserListStore) {}

  async list(
    actor: AuthorizationActor,
    input: ListUsersInput,
  ): Promise<User[]> {
    if (!canListUsers(actor)) {
      throw new AuthorizationDeniedError();
    }

    return this.users.list(input);
  }
}
