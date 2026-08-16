import { config as loadDotenv } from "dotenv";
import { z } from "zod";
import { createDatabasePool } from "@irruptive/database";
import { createAuth } from "../auth.js";

loadDotenv({
  path: new URL("../../../../.env", import.meta.url),
  quiet: true,
});

const bootstrapSchema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
  WEB_ORIGIN: z.url().default("http://localhost:5173"),
  BOOTSTRAP_ADMIN_NAME: z.string().trim().min(1),
  BOOTSTRAP_ADMIN_EMAIL: z.email(),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().min(12).max(128),
});

const environment = bootstrapSchema.parse(process.env);
const pool = createDatabasePool({ connectionString: environment.DATABASE_URL });

try {
  const existing = await pool.query<{ id: string; role: string }>(
    "SELECT id, role FROM users WHERE lower(email) = lower($1)",
    [environment.BOOTSTRAP_ADMIN_EMAIL],
  );

  if (existing.rows[0]) {
    console.log("Bootstrap administrator already exists; no changes made.");
    process.exitCode = 0;
  } else {
    const auth = createAuth(pool, {
      baseUrl: environment.BETTER_AUTH_URL,
      secret: environment.BETTER_AUTH_SECRET,
      trustedOrigins: [environment.WEB_ORIGIN],
      allowSignUp: true,
      autoSignInOnSignUp: false,
    });
    const result = await auth.api.signUpEmail({
      body: {
        name: environment.BOOTSTRAP_ADMIN_NAME,
        email: environment.BOOTSTRAP_ADMIN_EMAIL,
        password: environment.BOOTSTRAP_ADMIN_PASSWORD,
      },
    });

    await pool.query(
      `
        UPDATE users
        SET role = 'admin', email_verified = true, updated_at = now()
        WHERE id = $1
      `,
      [result.user.id],
    );

    console.log("Bootstrap administrator created.");
  }
} finally {
  await pool.end();
}
