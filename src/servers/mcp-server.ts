import {
  ObsidianSseServer,
  type ObsidianSseServerConfig,
} from "./mcp-sse-server";
import { ObsidianStdioServer } from "./mcp-stdio-server";

export { ObsidianSseServer, ObsidianStdioServer };
export type { ObsidianSseServerConfig };

/**
 * Creates and returns an MCP server instance based on the specified transport
 */
export function createMcpServer(
  config: ObsidianSseServerConfig
): ObsidianStdioServer;
export function createMcpServer(
  config: ObsidianSseServerConfig
): ObsidianSseServer;
export function createMcpServer(
  config: ObsidianSseServerConfig
): ObsidianStdioServer | ObsidianSseServer {
  if (config.transport === "stdio") {
    return new ObsidianStdioServer(config);
  } else if (config.transport === "sse") {
    return new ObsidianSseServer(config as ObsidianSseServerConfig);
  }

  throw new Error(`Unsupported transport: ${config.transport}`);
}

// Export ObsidianStdioServer as the default for backward compatibility
export default ObsidianStdioServer;
