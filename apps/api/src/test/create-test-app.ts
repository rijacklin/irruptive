import { vi } from "vitest";
import { createApp } from "../app.js";
import {
  CommentService,
  type CommentStore,
} from "../services/comment-service.js";
import {
  WorkOrderService,
  type WorkOrderStore,
} from "../services/work-order-service.js";

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

  const app = createApp({
    workOrderService: new WorkOrderService(store),
    commentService: new CommentService(commentStore, store),
  });

  return { app, store, commentStore };
}
