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

export function createTestApp() {
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
  });

  return { app, store, commentStore, userStore };
}
