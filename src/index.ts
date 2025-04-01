// Set NODE_TLS_REJECT_UNAUTHORIZED to 0 to bypass self-signed certificate validation
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { readFileSync } from "fs";
import { join } from "path";
import logger from "./lib/logger";
import { createMcpServer } from "./servers/mcp-server";
export * from "./servers/mcp-server";

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

// Get package version from package.json
const getPackageVersion = (): string => {
  try {
    const packagePath = join(__dirname, "..", "package.json");
    const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));
    return packageJson.version || "unknown";
  } catch (error) {
    logger.warn({ error }, "Failed to read package version");
    return "unknown";
  }
};

// Environment variables for configuration
const OBSIDIAN_BASE_URL =
  process.env.OBSIDIAN_BASE_URL || "https://127.0.0.1:27124";
const OBSIDIAN_API_KEY = process.env.OBSIDIAN_API_KEY || "";
const MCP_TRANSPORT = process.env.MCP_TRANSPORT || "stdio";
const MCP_PORT = parseInt(process.env.MCP_PORT || "3001", 10);

// Log startup configuration (but sanitize the API key)
logger.info(
  {
    obsidianBaseUrl: OBSIDIAN_BASE_URL,
    serverType: MCP_TRANSPORT,
    environment: process.env.NODE_ENV || "development",
    logLevel: process.env.LOG_LEVEL || "info",
    transportType: MCP_TRANSPORT,
    mcpDebug: process.env.MCP_DEBUG === "true",
    nodeVersion: process.version,
    packageVersion: getPackageVersion(),
  },
  "Starting MCP server"
);

// Check if API key is provided
if (!OBSIDIAN_API_KEY) {
  logger.error("OBSIDIAN_API_KEY environment variable is required");
  process.exit(1);
}

// Validate transport type
if (!["stdio", "sse"].includes(MCP_TRANSPORT)) {
  logger.error(
    `Invalid MCP_TRANSPORT: ${MCP_TRANSPORT}. Must be either 'stdio' or 'sse'`
  );
  process.exit(1);
}

// Entry point for MCP server
async function main() {
  try {
    // Create server based on transport
    const server =
      MCP_TRANSPORT === "stdio"
        ? createMcpServer({
            transport: "stdio",
            obsidianBaseUrl: OBSIDIAN_BASE_URL,
            obsidianApiKey: OBSIDIAN_API_KEY,
            port: MCP_PORT,
          })
        : createMcpServer({
            transport: "sse",
            obsidianBaseUrl: OBSIDIAN_BASE_URL,
            obsidianApiKey: OBSIDIAN_API_KEY,
            port: MCP_PORT,
          });

    logger.info(`Starting MCP server with ${MCP_TRANSPORT} transport`);

    // Start the server
    await server.start();

    // Handle process termination
    process.on("SIGINT", () => {
      logger.info("Received SIGINT signal");
      server.stop();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      logger.info("Received SIGTERM signal");
      server.stop();
      process.exit(0);
    });
  } catch (error) {
    logger.error({ error }, "Failed to start MCP server");
    process.exit(1);
  }
}

main();
