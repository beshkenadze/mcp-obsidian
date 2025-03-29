import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { McpServerConfig } from "./lib/common-server";
import { CommonMcpServer } from "./lib/common-server";
import logger from "./lib/logger";

export class ObsidianStdioServer extends CommonMcpServer {
  private transport: StdioServerTransport | null = null;
  private isRunning = false;

  constructor(config: McpServerConfig) {
    super(config);
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn("MCP stdio server is already running");
      return;
    }

    try {
      logger.info("Starting MCP stdio server");
      this.transport = new StdioServerTransport();
      await this.server.connect(this.transport);
      this.isRunning = true;
      logger.info("MCP stdio server started");
    } catch (error) {
      logger.error({ error }, "Failed to start MCP stdio server");
      this.stop();
      throw error;
    }
  }

  public stop(): void {
    if (this.isRunning) {
      logger.info("Stopping MCP stdio server");
      this.isRunning = false;
      // The stdio transport doesn't need explicit cleanup
      this.transport = null;
      logger.info("MCP stdio server stopped");
    }
  }
}
