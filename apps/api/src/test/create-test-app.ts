import { vi } from "vitest";
import { createApp } from "../app.js";
import {
  CommentService,
  type CommentStore,
} from "../services/comment-service.js";
import {
  WorkOrderService,
  type AssigneeStore,
  type WorkOrderStore,
} from "../services/work-order-service.js";
import { UserService, type UserListStore } from "../services/user-service.js";
import type { AuthorizationActor } from "../authorization/work-order-authorization.js";

const defaultActor: AuthorizationActor = {
  id: "234173b3-13a5-43c8-baf7-bf06640cf7fd",
  role: "admin",
};

export function createTestApp(actor: AuthorizationActor | null = defaultActor) {
  const store: WorkOrderStore = {
    create: vi.fn(),
    findById: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  const commentStore: CommentStore = {
    create: vi.fn(),
    listByWorkOrderId: vi.fn(),
  };

  const userStore: AssigneeStore & UserListStore = {
    findAssignableById: vi.fn(),
    list: vi.fn(),
  };

  const app = createApp({
    workOrderService: new WorkOrderService(store, userStore),
    commentService: new CommentService(commentStore, store),
    userService: new UserService(userStore),
    authHandler: (_request, response) => {
      response.status(404).end();
    },
    resolveSession: async () =>
      actor === null ? null : { user: { id: actor.id, role: actor.role } },
    webOrigin: "http://localhost:5173",
  });

  return { app, store, commentStore, userStore };
}
