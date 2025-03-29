import type { McpServerConfig } from "./lib/common-server";
import type { SseServerConfig } from "./mcp-sse-server";
import { ObsidianSseServer } from "./mcp-sse-server";
import { ObsidianStdioServer } from "./mcp-stdio-server";

export { ObsidianSseServer, ObsidianStdioServer };
export type { McpServerConfig, SseServerConfig };

/**
 * Creates and returns an MCP server instance based on the specified transport
 */
export function createMcpServer(
  config:
    | (McpServerConfig & { transport: "stdio" })
    | (SseServerConfig & { transport: "sse" })
): ObsidianSseServer | ObsidianStdioServer {
  if (config.transport === "sse") {
    return new ObsidianSseServer(config);
  } else {
    return new ObsidianStdioServer(config);
  }
}

// Export ObsidianSseServer as the default for simplicity
export default ObsidianSseServer;
