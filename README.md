# Irruptive

> AI's sudden entry into the traditional work-order workflow

Irruptive is a production-oriented, AI-first, work-order management application.

## Prerequisites

- Node.js 22 or newer
- npm 11 or newer
- Docker with Docker Compose (for PostgreSQL)

## Local setup

Install the dependencies and create your local environment file:

```bash
npm install
cp .env.example .env
```

Start PostgreSQL, wait for it to become healthy, and apply the existing database migrations:

```bash
docker compose up -d postgres
```

Generate a strong Better Auth secret and place it in `.env`. The value must be
at least 32 characters and must not be committed. Then create the initial local
administrator after applying migrations:

```bash
npm run db:migrate
npm run auth:bootstrap-admin
```

The bootstrap command reads `BOOTSTRAP_ADMIN_NAME`,
`BOOTSTRAP_ADMIN_EMAIL`, and `BOOTSTRAP_ADMIN_PASSWORD` from `.env`. It creates
the account only when that email does not already exist. Public signup is
disabled; later user provisioning will be restricted to administrators.

Application API routes require a Better Auth session cookie. The API derives
work-order creators and comment authors from that session; client-supplied user
IDs are not accepted. `GET /health` and `/api/auth/*` remain public.

Role permissions are enforced by backend services. Requesters see work orders
they created, technicians see work assigned to them, and supervisors and
administrators have organization-wide visibility. Supervisors can assign and
reprioritize work; assigned technicians can progress work through technician
statuses; only administrators can delete work orders. Supervisors and
administrators may request paid AI analysis. Anyone who can view a work order
may view its latest stored analysis.

Start each application in a separate terminal:

```bash
npm run dev:web
npm run dev:api
npm run dev:worker
```

The frontend is available at `http://localhost:5173`. The API listens at `http://localhost:3000`; verify it with:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{ "status": "ok" }
```

The API verifies its PostgreSQL connection before it begins listening. If PostgreSQL is unavailable or `DATABASE_URL` is invalid, API startup fails instead of reporting a misleading healthy state.

Authentication is managed by Better Auth using email/password credentials and
database-backed cookie sessions. Passwords are hashed by Better Auth and session
cookies are HttpOnly. `WEB_ORIGIN` controls credentialed CORS access, while
`BETTER_AUTH_URL` is the public URL of the API authentication endpoints.

### Optional AI analysis

AI configuration is optional. With `AI_PROVIDER` blank, the API and all
non-AI work-order features start normally; requesting analysis returns a
deliberate `503 AI_PROVIDER_UNAVAILABLE` response. To enable the OpenAI
adapter, set these server-only values in `.env`:

```dotenv
AI_PROVIDER=openai
AI_MODEL=your-structured-output-capable-model
AI_API_KEY=your-api-key
AI_TIMEOUT_MS=15000
```

Never prefix the API key with `VITE_` or expose it to the browser. Successful
analyses are stored as immutable history with provider, model, and prompt
version metadata. They remain recommendations and never update canonical work
order fields.

The normal automated suite uses deterministic fakes and never calls OpenAI. An
opt-in manual check requires a signed-in supervisor or administrator session.
With the API and web app running and OpenAI configured, sign in through the UI,
open an accessible work order, and choose **Generate analysis**. Alternatively,
copy the session cookie from your browser and run:

```bash
curl -X POST \
  -H 'Cookie: better-auth.session_token=YOUR_SESSION_TOKEN' \
  http://localhost:3000/api/work-orders/WORK_ORDER_ID/ai-analysis
```

Do not add this live-provider check to `npm test` or CI.

### PostgreSQL port conflicts

PostgreSQL uses host port `5432` by default. If another PostgreSQL instance or application already uses that port, choose an unused port in your local `.env`. For example:

```dotenv
POSTGRES_PORT=5433
DATABASE_URL=postgresql://irruptive:irruptive@localhost:5433/irruptive
```

`POSTGRES_PORT` and the port in `DATABASE_URL` must match. After changing the port, run:

```bash
npm run db:setup
```

### Creating database migrations

Initial setup applies the migrations already committed to the repository. To create a new migration while developing a schema change, provide a descriptive name:

```bash
npm run db:create-migration -- add-work-order-comments
```

### API integration tests

The API integration suite uses the real Express, service, repository, and PostgreSQL stack. It requires a dedicated test database so cleanup cannot remove local development data. Create it once after starting PostgreSQL:

```bash
docker compose exec postgres createdb -U irruptive irruptive_test
```

If the database already exists, skip that command. Keep `TEST_DATABASE_URL` distinct from `DATABASE_URL`, as shown in `.env.example`.

Run the API integration suite with:

```bash
npm run test:api:integration
```

This applies pending migrations to `TEST_DATABASE_URL` before running the focused suite. To migrate the test database and run every formatting, linting, typecheck, test, and build check, use:

```bash
npm run verify:integration
```

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run format:check
```

## Workspace layout

```text
apps/web          React + Vite browser application
apps/api          Express REST API
apps/worker       Background-worker process (no jobs yet)
packages/shared   Browser/server-safe shared contracts
packages/database PostgreSQL connection boundary
```

## Work-order API

The API currently supports:

- `POST /api/work-orders`
- `GET /api/work-orders`
- `GET /api/work-orders/:id`
- `PATCH /api/work-orders/:id`
- `DELETE /api/work-orders/:id`
- `POST /api/work-orders/:id/ai-analysis`
- `GET /api/work-orders/:id/ai-analysis` (`data: null` before first analysis)

## Authorization policy

The API enforces server-side work-order authorization covering ownership,
assignment, role-based updates, commenting, deletion, and AI analysis. Better
Auth middleware supplies the verified actor; request fields and ad hoc identity
headers are never trusted as authentication.
