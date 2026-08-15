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
