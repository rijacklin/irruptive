# Irruptive

> AI's sudden entry into the traditional work-order workflow

<img width="2017" height="788" alt="Screenshot 2026-08-17 153715" src="https://github.com/user-attachments/assets/8ad6d0a7-9cd2-41d5-8b27-0572193118f1" />
&nbsp;

Irruptive is a production-oriented, AI-first, work-order management application.
&nbsp;

<details>
  <summary>Example of generated AI analysis on a work order</summary>
  &nbsp;
  <img width="1415" height="686" alt="Screenshot 2026-08-17 161129" src="https://github.com/user-attachments/assets/69b186c1-65d2-474d-905f-eefe26c08020" />
</details>

## Prerequisites

- Node.js 22 or newer
- npm 11 or newer
- Docker with Docker Compose (for PostgreSQL)

## Local development setup

Install the dependencies and create local environment file:

```bash
npm install
cp .env.example .env
```

Start PostgreSQL, wait for it to become healthy, and apply the existing database migrations:

```bash
npm run db:setup
```

Generate a strong Better Auth secret (at least 32 charcters) and place it in `.env`. Better Auth's [docs](https://better-auth.com/docs/installation#set-environment-variables) recommend using `openssl rand -base64 32` to manually generate this key.

Afterwards, generate the local admin account:

```bash
npm run auth:bootstrap-admin
```

Start each application in a separate terminal:

```bash
npm run dev:web
npm run dev:api
npm run dev:worker
```

The frontend is available at `http://localhost:5173`. The API listens at `http://localhost:3000`; verify it with:

Liveness probe for the api exists at your api's configured address. For example, using `http://localhost:3000` for the api:

```bash
curl http://localhost:3000/health
```

### Optional AI analysis

AI configuration is entirely optional. Currently, OpenAI is the only provider supported. To enable, place the following in your local environment file:

```dotenv
AI_PROVIDER=openai
AI_MODEL=your-structured-output-capable-model
AI_API_KEY=your-api-key
AI_TIMEOUT_MS=15000
```

Successful analyses are stored as immutable history with provider, model, and prompt version metadata. For cost reasons, AI features are restricted to users with the "admin" or "supervisor" role.

```bash
npm run db:setup
```

## Verification

Run the main checks without changing source files:

```bash
npm run verify
```

This checks formatting, lint, and types, runs the non-database Node and frontend
tests, and builds the workspaces. Build outputs are generated in ignored
directories. Use `npm run format` explicitly to apply formatting fixes.
`npm test` runs only the non-database tests; it does not require PostgreSQL.

For database or API changes, also run the PostgreSQL integration checks:

```bash
docker compose up -d --wait postgres
npm run verify:integration
```

Set `TEST_DATABASE_URL` in `.env` to a dedicated test database, separate from
`DATABASE_URL`. Integration tests modify test data. `verify:integration` applies
test database migrations and runs the `integration` Vitest project: API
`*.integration.test.ts` suites and database migration/repository tests. It does
not repeat formatting, lint, typechecking, non-database tests, or builds.
Run both verification commands when changing test selection or verification
scripts, and for a complete local check.

For a focused API integration run, use `npm run test:api:integration`; this
migrates the test database and runs all API integration suites. Normal automated
tests use fake or mocked AI providers and never call a paid AI API.
