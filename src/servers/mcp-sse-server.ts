import { spawn } from "child_process";
import type { McpServerConfig } from "../lib/common-server";
import { CommonMcpServer } from "../lib/common-server";
import logger from "../lib/logger";

export interface ObsidianSseServerConfig extends McpServerConfig {
  port: number;
  stdioCmd?: string;
  transport: "sse" | "stdio";
}

export class ObsidianSseServer extends CommonMcpServer {
  private isRunning = false;
  private gatewayProcess: any = null;
  private port: number;
  private stdioCmd: string;

  constructor(config: ObsidianSseServerConfig) {
    super(config);
    this.port = config.port;
    this.stdioCmd = config.stdioCmd || "bun dist/stdio.js";
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn("MCP SSE server is already running");
      return;
    }

    try {
      logger.info({ port: this.port }, "Starting MCP SSE server");

      // Generate a random port between 3100-4000 for the STDIO subprocess to avoid conflicts
      const stdioPort = process.env.PORT
        ? parseInt(process.env.PORT, 10) + 1
        : 3001;

      // Add PORT env var to the stdio command to ensure it uses a different port
      const cmdWithPort = `PORT=${stdioPort} ${this.stdioCmd}`;

      // Use LOG_TO_STDERR to prevent sonic-boom errors in child process
      const cmdWithEnv = `LOG_TO_STDERR=true ${cmdWithPort}`;

      // Run supergateway with our stdio command
      const args = [
        "--stdio",
        cmdWithEnv,
        "--port",
        this.port.toString(),
        "--baseUrl",
        `http://localhost:${this.port}`,
        "--ssePath",
        "/sse",
        "--messagePath",
        "/message",
        "--cors",
        "--healthEndpoint",
        "/healthz",
      ];

      // Spawn the supergateway process
      this.gatewayProcess = spawn("npx", ["-y", "supergateway", ...args], {
        stdio: ["ignore", "inherit", "inherit"],
        env: {
          ...process.env,
          NODE_PATH: process.env.NODE_PATH || ".",
        },
        detached: false,
      });

      // Handle process events
      this.gatewayProcess.on("error", (error: Error) => {
        logger.error({ error }, "Supergateway process error");
        this.stop();
      });

      this.isRunning = true;
      logger.info(
        { port: this.port },
        "MCP SSE server started with supergateway"
      );
    } catch (error) {
      logger.error({ error }, "Failed to start MCP SSE server");
      this.stop();
      throw error;
    }
  }

  public stop(): void {
    if (this.isRunning) {
      logger.info("Stopping MCP SSE server");
      this.isRunning = false;

      if (this.gatewayProcess) {
        try {
          this.gatewayProcess.kill("SIGTERM");
        } catch (error) {
          logger.error({ error }, "Error stopping supergateway process");
        }
        this.gatewayProcess = null;
      }

      logger.info("MCP SSE server stopped");
    }
  }
}
