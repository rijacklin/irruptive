import type { Request, RequestHandler } from "express";
import { fromNodeHeaders } from "better-auth/node";
import type { UserRole } from "@irruptive/shared";
import { userRoles } from "@irruptive/shared";
import { AuthenticationRequiredError } from "../errors/application-error.js";
import type { AuthorizationActor } from "../authorization/work-order-authorization.js";

export interface AuthSession {
  user: {
    id: string;
    role: UserRole;
  };
}

export type SessionResolver = (headers: Headers) => Promise<AuthSession | null>;

const authenticatedActor = Symbol("authenticatedActor");

type RequestWithActor = Request & {
  [authenticatedActor]?: AuthorizationActor;
};

function hasValidRole(role: unknown): role is UserRole {
  return typeof role === "string" && userRoles.includes(role as UserRole);
}

export function getAuthenticatedActor(request: Request): AuthorizationActor {
  const actor = (request as RequestWithActor)[authenticatedActor];

  if (!actor) {
    throw new AuthenticationRequiredError();
  }

  return actor;
}

export function requireAuthentication(
  resolveSession: SessionResolver,
): RequestHandler {
  return async (request, _response, next) => {
    try {
      const session = await resolveSession(fromNodeHeaders(request.headers));

      if (!session || !hasValidRole(session.user.role)) {
        next(new AuthenticationRequiredError());
        return;
      }

      (request as RequestWithActor)[authenticatedActor] = {
        id: session.user.id,
        role: session.user.role,
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}
