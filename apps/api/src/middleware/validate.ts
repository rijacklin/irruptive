import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { output, ZodType } from "zod";

type RequestLocation = "params" | "query" | "body";
type RequestSchemas = Partial<Record<RequestLocation, ZodType>>;

type ValidatedInput<Schemas extends RequestSchemas> = {
  [Location in keyof Schemas]: Schemas[Location] extends ZodType
    ? output<Schemas[Location]>
    : never;
};

type ValidatedHandler<Schemas extends RequestSchemas> = (
  input: ValidatedInput<Schemas>,
  request: Request,
  response: Response,
  next: NextFunction,
) => void | Promise<void>;

const requestLocations = ["params", "query", "body"] as const;

export function validate<const Schemas extends RequestSchemas>(
  schemas: Schemas,
  handler: ValidatedHandler<Schemas>,
): RequestHandler {
  return async (request, response, next) => {
    const validated: Partial<Record<RequestLocation, unknown>> = {};

    for (const location of requestLocations) {
      const schema = schemas[location];

      if (!schema) {
        continue;
      }

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
            details,
          },
        });

        return;
      }

      validated[location] = result.data;
    }

    return handler(
      validated as ValidatedInput<Schemas>,
      request,
      response,
      next,
    );
  };
}
