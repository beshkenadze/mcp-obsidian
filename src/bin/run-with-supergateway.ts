#!/usr/bin/env bun
import { spawn } from "child_process";
import logger from "../lib/logger";

// Get the port from environment or use default
const port = process.env.PORT || "3000";
const stdioCmd = "bun run start:stdio";
const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;

logger.info("Starting MCP server with supergateway");
logger.info(`Port: ${port}`);
logger.info(`Base URL: ${baseUrl}`);
logger.info(`STDIO Command: ${stdioCmd}`);

// Run supergateway with our stdio server
const args = [
  "--stdio",
  stdioCmd,
  "--port",
  port,
  "--baseUrl",
  baseUrl,
  "--ssePath",
  "/sse",
  "--messagePath",
  "/message",
  "--cors",
  "--healthEndpoint",
  "/healthz",
];

// Spawn the process
const child = spawn("npx", ["-y", "supergateway", ...args], {
  stdio: "inherit",
  env: {
    ...process.env,
    LOG_TO_STDERR: "true", // Help prevent sonic-boom errors
  },
});

// Handle process exit
process.on("SIGINT", () => {
  logger.info("Received SIGINT, shutting down...");
  child.kill("SIGINT");
});

process.on("SIGTERM", () => {
  logger.info("Received SIGTERM, shutting down...");
  child.kill("SIGTERM");
});

child.on("exit", (code) => {
  logger.info(`Child process exited with code ${code}`);
  process.exit(code || 0);
});

child.on("error", (err) => {
  logger.error(`Child process error: ${err}`);
  process.exit(1);
});
