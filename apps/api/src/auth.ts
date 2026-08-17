import type { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { betterAuth } from "better-auth";

/**
 * Defines the structure of a Better Auth configuration object.
 */
export interface AuthConfiguration {
  baseUrl: string;
  secret: string;
  trustedOrigins: string[];
  allowSignUp?: boolean;
  autoSignInOnSignUp?: boolean;
}

/**
 * Generates BetterAuth wrapper for application.
 *
 * @param database - A pool of PG database connections.
 * @param config - Better Auth configuration object.
 */
export function createAuth(database: Pool, config: AuthConfiguration) {
  return betterAuth({
    appName: "Irruptive",
    database,
    baseURL: config.baseUrl,
    basePath: "/api/auth",
    secret: config.secret,
    trustedOrigins: config.trustedOrigins,
    advanced: {
      database: {
        generateId: () => randomUUID(),
      },
    },
    emailAndPassword: {
      enabled: true,
      disableSignUp: !(config.allowSignUp ?? false),
      autoSignIn: config.autoSignInOnSignUp ?? true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
    },
    user: {
      modelName: "users",
      fields: {
        emailVerified: "email_verified",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
      additionalFields: {
        role: {
          type: ["requester", "technician", "supervisor", "admin"],
          required: true,
          defaultValue: "requester",
          input: false,
          fieldName: "role",
        },
      },
    },
    session: {
      modelName: "auth_sessions",
      fields: {
        expiresAt: "expires_at",
        createdAt: "created_at",
        updatedAt: "updated_at",
        ipAddress: "ip_address",
        userAgent: "user_agent",
        userId: "user_id",
      },
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    account: {
      modelName: "auth_accounts",
      fields: {
        accountId: "account_id",
        providerId: "provider_id",
        userId: "user_id",
        accessToken: "access_token",
        refreshToken: "refresh_token",
        idToken: "id_token",
        accessTokenExpiresAt: "access_token_expires_at",
        refreshTokenExpiresAt: "refresh_token_expires_at",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    },
    verification: {
      modelName: "auth_verifications",
      fields: {
        expiresAt: "expires_at",
        createdAt: "created_at",
        updatedAt: "updated_at",
      },
    },
  });
}
export type Auth = ReturnType<typeof createAuth>;
