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

export class AuthenticationRequiredError extends ApplicationError {
  constructor() {
    super(401, "AUTHENTICATION_REQUIRED", "Authentication is required.");
  }
}

export class AuthorizationDeniedError extends ApplicationError {
  constructor() {
    super(
      403,
      "AUTHORIZATION_DENIED",
      "You do not have permission to perform this operation.",
    );
  }
}

export class WorkOrderNotFoundError extends ApplicationError {
  constructor(id: string) {
    super(404, "WORK_ORDER_NOT_FOUND", `Work order ${id} does not exist.`);
  }
}

export class AssigneeNotEligibleError extends ApplicationError {
  constructor(id: string) {
    super(
      422,
      "ASSIGNEE_NOT_ELIGIBLE",
      `User ${id} is not eligible for work-order assignment.`,
    );
  }
}

export class AIProviderUnavailableError extends ApplicationError {
  constructor() {
    super(
      503,
      "AI_PROVIDER_UNAVAILABLE",
      "AI analysis is not configured or is currently unavailable.",
    );
  }
}

export class AIProviderTimeoutError extends ApplicationError {
  constructor() {
    super(504, "AI_PROVIDER_TIMEOUT", "The AI provider request timed out.");
  }
}

export class AIProviderRateLimitError extends ApplicationError {
  constructor() {
    super(
      429,
      "AI_PROVIDER_RATE_LIMITED",
      "The AI provider rate limit was exceeded.",
    );
  }
}

export class AIProviderOutputError extends ApplicationError {
  constructor() {
    super(
      502,
      "AI_PROVIDER_INVALID_OUTPUT",
      "The AI provider returned invalid output.",
    );
  }
}

export class AIProviderUpstreamError extends ApplicationError {
  constructor() {
    super(502, "AI_PROVIDER_FAILURE", "The AI provider request failed.");
  }
}
