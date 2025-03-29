import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import type { McpServerConfig } from "./lib/common-server";
import { CommonMcpServer } from "./lib/common-server";
import logger from "./lib/logger";

export interface SseServerConfig extends McpServerConfig {
  port: number;
}

export class ObsidianSseServer extends CommonMcpServer {
  private port: number;
  private expressApp: express.Application;
  private transports: Record<string, SSEServerTransport> = {};
  private httpServer: any = null;
  private serverName: string;
  private serverVersion: string;

  constructor(config: SseServerConfig) {
    super(config);
    this.port = config.port;
    this.serverName = config.name || "Obsidian MCP";
    this.serverVersion = config.version || "1.0.0";

    // Setup Express application
    this.expressApp = express();
    this.expressApp.use(express.json());
    this.setupCorsHandling();
    this.setupEndpoints();
  }

  private setupCorsHandling() {
    this.expressApp.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type");
      if (req.method === "OPTIONS") {
        res.status(204).end();
        return;
      }
      next();
    });
  }

  private setupEndpoints() {
    // Setup SSE endpoints for MCP communication
    this.expressApp.get("/sse", async (req, res) => {
      try {
        logger.info("New SSE connection established");
        const transport = new SSEServerTransport("/messages", res);
        this.transports[transport.sessionId] = transport;

        res.on("close", () => {
          logger.info(
            { sessionId: transport.sessionId },
            "SSE connection closed"
          );
          delete this.transports[transport.sessionId];
        });

        await this.server.connect(transport);
      } catch (error) {
        logger.error({ error }, "Error establishing SSE connection");
        res.status(500).end();
      }
    });

    this.expressApp.post("/messages", async (req, res) => {
      try {
        const sessionId = req.query.sessionId as string;
        logger.debug({ sessionId }, "Received message for session");

        const transport = this.transports[sessionId];
        if (transport) {
          await transport.handlePostMessage(req, res);
        } else {
          logger.warn({ sessionId }, "No transport found for session");
          res.status(400).send("No transport found for sessionId");
        }
      } catch (error) {
        logger.error({ error }, "Error handling message");
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Add a simple discovery endpoint for clients
    this.expressApp.get("/", (_, res) => {
      logger.debug("Received discovery request");
      res.json({
        schema_version: "v1",
        protocol: "mcp",
        server_name: this.serverName,
        server_version: this.serverVersion,
        description: "MCP server for Obsidian interactions",
      });
    });
  }

  public start() {
    // Start the server
    this.httpServer = this.expressApp.listen(this.port, () => {
      logger.info({ port: this.port }, "MCP SSE server started");
    });

    return this.httpServer;
  }

  public stop() {
    if (this.httpServer) {
      this.httpServer.close();
      logger.info("MCP SSE server stopped");
      this.httpServer = null;
    }
  }
}
