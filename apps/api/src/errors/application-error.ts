export class ApplicationError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}

export class WorkOrderNotFoundError extends ApplicationError {
  constructor(id: string) {
    super(404, "WORK_ORDER_NOT_FOUND", `Work order ${id} does not exist.`);
  }
}
