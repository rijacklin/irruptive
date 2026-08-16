import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createIntegrationTestApp } from "../test/create-integration-test-app.js";

let testApp: Awaited<ReturnType<typeof createIntegrationTestApp>>;
let signupDisabledApp: Awaited<ReturnType<typeof createIntegrationTestApp>>;

beforeAll(async () => {
  testApp = await createIntegrationTestApp({ useBetterAuthSessions: true });
  signupDisabledApp = await createIntegrationTestApp({ allowSignUp: false });
});

afterEach(async () => {
  await testApp.pool.query("DELETE FROM comments");
  await testApp.pool.query("DELETE FROM work_orders");
  await testApp.pool.query("DELETE FROM users");
});

afterAll(async () => {
  await testApp.pool.end();
  await signupDisabledApp.pool.end();
});

describe("Better Auth integration", () => {
  it("disables public signup in the runtime configuration", async () => {
    const response = await request(signupDisabledApp.app)
      .post("/api/auth/sign-up/email")
      .send({
        name: "Uninvited User",
        email: "uninvited@example.com",
        password: "correct-horse-battery-staple",
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("EMAIL_PASSWORD_SIGN_UP_DISABLED");
  });

  it("creates a session cookie and returns the authenticated user", async () => {
    const agent = request.agent(testApp.app);

    const signUpResponse = await agent.post("/api/auth/sign-up/email").send({
      name: "Alex Requester",
      email: "alex@example.com",
      password: "correct-horse-battery-staple",
      role: "admin",
    });

    expect(signUpResponse.status).toBe(200);
    expect(signUpResponse.headers["set-cookie"]).toEqual(
      expect.arrayContaining([
        expect.stringContaining("better-auth.session_token="),
      ]),
    );
    expect(signUpResponse.body.user).toMatchObject({
      name: "Alex Requester",
      email: "alex@example.com",
      role: "requester",
    });

    const sessionResponse = await agent.get("/api/auth/get-session");

    expect(sessionResponse.status).toBe(200);
    expect(sessionResponse.body.user).toMatchObject({
      email: "alex@example.com",
      role: "requester",
    });
    expect(sessionResponse.body.session.id).toEqual(expect.any(String));
  });

  it("protects application APIs with the Better Auth session", async () => {
    const anonymousResponse = await request(testApp.app).get(
      "/api/work-orders",
    );

    expect(anonymousResponse.status).toBe(401);
    expect(anonymousResponse.body.error.code).toBe("AUTHENTICATION_REQUIRED");

    const agent = request.agent(testApp.app);
    await agent.post("/api/auth/sign-up/email").send({
      name: "API Requester",
      email: "api-requester@example.com",
      password: "correct-horse-battery-staple",
    });

    const createResponse = await agent.post("/api/work-orders").send({
      title: "Inspect authenticated conveyor",
      description: "The signed-in requester observed intermittent vibration.",
    });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.createdBy).toEqual(expect.any(String));

    const user = await testApp.pool.query<{ id: string }>(
      "SELECT id FROM users WHERE email = $1",
      ["api-requester@example.com"],
    );
    expect(createResponse.body.data.createdBy).toBe(user.rows[0]?.id);
  });

  it("signs in with a password and revokes the session on sign out", async () => {
    const provisioningAgent = request.agent(testApp.app);
    await provisioningAgent.post("/api/auth/sign-up/email").send({
      name: "Taylor Technician",
      email: "taylor@example.com",
      password: "correct-horse-battery-staple",
    });
    await provisioningAgent.post("/api/auth/sign-out");

    const agent = request.agent(testApp.app);
    const invalidResponse = await agent.post("/api/auth/sign-in/email").send({
      email: "taylor@example.com",
      password: "incorrect-password",
    });
    expect(invalidResponse.status).toBe(401);

    const signInResponse = await agent.post("/api/auth/sign-in/email").send({
      email: "taylor@example.com",
      password: "correct-horse-battery-staple",
    });
    expect(signInResponse.status).toBe(200);

    const signOutResponse = await agent.post("/api/auth/sign-out");
    expect(signOutResponse.status).toBe(200);

    const sessionResponse = await agent.get("/api/auth/get-session");
    expect(sessionResponse.status).toBe(200);
    expect(sessionResponse.body).toBeNull();
  });

  it("allows credentialed CORS requests only from the configured web origin", async () => {
    const allowedResponse = await request(testApp.app)
      .options("/api/auth/get-session")
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "GET");

    expect(allowedResponse.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5173",
    );
    expect(allowedResponse.headers["access-control-allow-credentials"]).toBe(
      "true",
    );

    const rejectedResponse = await request(testApp.app)
      .options("/api/auth/get-session")
      .set("Origin", "https://malicious.example")
      .set("Access-Control-Request-Method", "GET");

    expect(rejectedResponse.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5173",
    );
    expect(rejectedResponse.headers["access-control-allow-origin"]).not.toBe(
      "https://malicious.example",
    );
  });
});
