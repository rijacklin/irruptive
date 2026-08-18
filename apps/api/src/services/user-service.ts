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
  constructor(private readonly users: UserListStore) { }

  /**
   * Lists users matching the requested filters.
   *
   * @param actor - The authenticated user requesting the user list.
   * @param input - Filtering criteria for the user list.
   * @returns The users matching the requested filters.
   * @throws {@link AuthorizationDeniedError} If the user is not authorized to view a list of other users.
   */
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
