// Set NODE_TLS_REJECT_UNAUTHORIZED to 0 to bypass self-signed certificate validation
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import logger from "./lib/logger";
import { createMcpServer } from "./mcp-server";
export * from "./mcp-server";

/**
 * Example usage:
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
// The Environment variables for configuration
const OBSIDIAN_BASE_URL =
  process.env.OBSIDIAN_BASE_URL || "https://127.0.0.1:27124";
const OBSIDIAN_API_KEY = process.env.OBSIDIAN_API_KEY || "";
const SERVER_TYPE = (process.env.SERVER_TYPE || "bun") as "bun" | "express";
const MCP_DEBUG = process.env.MCP_DEBUG === "true";

// Log startup configuration (but sanitize the API key)
logger.info(
  {
    obsidianBaseUrl: OBSIDIAN_BASE_URL,
    serverType: SERVER_TYPE,
    environment: process.env.NODE_ENV || "development",
    logLevel: process.env.LOG_LEVEL || "info",
    transportType: "stdio",
    mcpDebug: MCP_DEBUG,
    nodeVersion: process.version,
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
    logger.debug("Setting up MCP server with stdio transport");

    const baseConfig = {
      obsidianBaseUrl: OBSIDIAN_BASE_URL,
      obsidianApiKey: OBSIDIAN_API_KEY,
      name: process.env.MCP_SERVER_NAME || "Obsidian MCP Server",
      version: process.env.MCP_SERVER_VERSION || "1.0.0",
    };

    logger.debug(
      {
        ...baseConfig,
        obsidianApiKey: "***", // Redacted for security
      },
      "Base config prepared"
    );

    let server;
    try {
      logger.debug("Creating stdio server");
      server = createMcpServer({
        ...baseConfig,
        transport: "stdio",
      });

      logger.debug(
        {
          serverType: "stdio",
          serverConfig: {
            ...baseConfig,
            obsidianApiKey: "***", // Redacted for security
          },
        },
        "Server created successfully"
      );
    } catch (error) {
      logger.error(
        { error, stack: (error as Error).stack },
        "Failed to create MCP server"
      );
      process.exit(1);
    }

    // Handle termination signals
    process.on("SIGINT", () => {
      logger.info("Received SIGINT, shutting down");
      server.stop();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      logger.info("Received SIGTERM, shutting down");
      server.stop();
      process.exit(0);
    });

    try {
      logger.debug("Starting server");
      await server.start();
      logger.info("STDIO server started successfully");
    } catch (error) {
      logger.error(
        { error, stack: (error as Error).stack },
        "Error starting MCP server"
      );
      process.exit(1);
    }
  })().catch((err) => {
    console.error("Error starting MCP server:", err);
    process.exit(1);
  });
}
