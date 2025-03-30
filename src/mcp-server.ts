import type { McpServerConfig } from "./lib/common-server";
import { ObsidianStdioServer } from "./mcp-stdio-server";

export { ObsidianStdioServer };
export type { McpServerConfig };

/**
 * Creates and returns an MCP server instance based on the specified transport
 */
export function createMcpServer(
  config: McpServerConfig & { transport: "stdio" }
): ObsidianStdioServer {
  return new ObsidianStdioServer(config);
}

// Export ObsidianStdioServer as the default for simplicity
export default ObsidianStdioServer;
