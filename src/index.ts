// Set NODE_TLS_REJECT_UNAUTHORIZED to 0 to bypass self-signed certificate validation
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import logger from "./lib/logger";
import { createMcpServer } from "./mcp-server";
export * from "./mcp-server";

/**
 * Example usage:
 *
 * // For HTTP/SSE transport
 * const sseServer = createMcpServer({
 *   transport: "sse",
 *   port: 3000,
 *   obsidianBaseUrl: "http://localhost:27123",
 *   obsidianApiKey: "your-api-key"
 * });
 * await sseServer.start();
 *
 * // For stdio transport
 * const stdioServer = createMcpServer({
 *   transport: "stdio",
 *   obsidianBaseUrl: "http://localhost:27123",
 *   obsidianApiKey: "your-api-key"
 * });
 * await stdioServer.start();
 */

// Environment variables for configuration
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3003;
const OBSIDIAN_BASE_URL =
  process.env.OBSIDIAN_BASE_URL || "https://127.0.0.1:27124";
const OBSIDIAN_API_KEY = process.env.OBSIDIAN_API_KEY || "";
const SERVER_TYPE = (process.env.SERVER_TYPE || "bun") as "bun" | "express";

// Log startup configuration (but sanitize the API key)
logger.info(
  {
    port: PORT,
    obsidianBaseUrl: OBSIDIAN_BASE_URL,
    serverType: SERVER_TYPE,
    environment: process.env.NODE_ENV || "development",
  },
  "Starting MCP server"
);

// Check if API key is provided
if (!OBSIDIAN_API_KEY) {
  logger.error("OBSIDIAN_API_KEY environment variable is required");
  process.exit(1);
}

// Validate server type
if (!["bun", "express"].includes(SERVER_TYPE)) {
  logger.error(
    `Invalid SERVER_TYPE: ${SERVER_TYPE}. Must be either 'bun' or 'express'`
  );
  process.exit(1);
}

// If this file is run directly, start an MCP server based on environment variables
if (require.main === module) {
  (async () => {
    const transport = process.env.MCP_TRANSPORT || "sse";
    const baseConfig = {
      obsidianBaseUrl:
        process.env.OBSIDIAN_BASE_URL || "http://localhost:27123",
      obsidianApiKey: process.env.OBSIDIAN_API_KEY || "",
      name: process.env.MCP_SERVER_NAME,
      version: process.env.MCP_SERVER_VERSION,
    };

    let server;
    if (transport === "stdio") {
      server = createMcpServer({
        ...baseConfig,
        transport: "stdio",
      });
    } else {
      server = createMcpServer({
        ...baseConfig,
        transport: "sse",
        port: parseInt(process.env.MCP_PORT || "3000", 10),
      });
    }

    // Handle termination signals
    process.on("SIGINT", () => {
      server.stop();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      server.stop();
      process.exit(0);
    });

    await server.start();
  })().catch((err) => {
    console.error("Error starting MCP server:", err);
    process.exit(1);
  });
}
