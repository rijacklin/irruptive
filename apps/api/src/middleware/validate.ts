import type { RequestHandler } from "express";
import type { ZodType } from "zod";

type RequestLocation = "body" | "params" | "query";

export function validate(
  location: RequestLocation,
  schema: ZodType,
): RequestHandler {
  return (request, response, next) => {
    const result = schema.safeParse(request[location]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.map(String).join("."),
        code: issue.code,
        message: issue.message,
      }));

      response.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "The request is invalid.",
          details: details,
        },
      });

      return;
    }

    response.locals.validated ??= {};
    response.locals.validated[location] = result.data;

    next();
  };
}
