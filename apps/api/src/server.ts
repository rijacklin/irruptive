import { config as loadDotenv } from "dotenv";
import {
  checkDatabaseConnection,
  createDatabasePool,
} from "@irruptive/database";
import { createApp } from "./app.js";
import { loadEnvironment } from "./config.js";

loadDotenv({
  // fix to resolve .env in root dir
  path: new URL("../../../.env", import.meta.url),
  quiet: true
});

const environment = loadEnvironment();

const pool = createDatabasePool({ connectionString: environment.DATABASE_URL });
await checkDatabaseConnection(pool);
console.log("Database connection established");

const server = createApp().listen(
  environment.API_PORT,
  environment.API_HOST,
  () => {
    console.log(
      `API listening on http://${environment.API_HOST}:${environment.API_PORT}`,
    );
  },
);

async function shutdown(signal: string): Promise<void> {
  console.log(`Received ${signal}; shutting down`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

// server can listen to OS signals to properly shutdowwn
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
