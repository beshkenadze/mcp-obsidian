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

    logger.debug(
      {
        port: this.port,
        serverName: this.serverName,
        serverVersion: this.serverVersion,
      },
      "Initializing SSE server"
    );

    // Setup Express application
    this.expressApp = express();
    this.expressApp.use(express.json());
    this.setupCorsHandling();
    this.setupEndpoints();

    logger.debug("Express app and endpoints configured");
  }

  private setupCorsHandling() {
    logger.debug("Setting up CORS handling");
    this.expressApp.use((req, res, next) => {
      logger.trace(
        {
          method: req.method,
          url: req.url,
          origin: req.headers.origin || "*",
        },
        "CORS request received"
      );

      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type");
      if (req.method === "OPTIONS") {
        logger.trace("Responding to OPTIONS request");
        res.status(204).end();
        return;
      }
      next();
    });
  }

  private setupEndpoints() {
    // Setup SSE endpoints for MCP communication
    logger.debug("Setting up SSE endpoints");

    this.expressApp.get("/sse", async (req, res) => {
      try {
        logger.info(
          {
            headers: req.headers,
            query: req.query,
            ip: req.ip,
          },
          "New SSE connection attempt"
        );

        const transport = new SSEServerTransport("/messages", res);
        this.transports[transport.sessionId] = transport;

        logger.debug(
          {
            sessionId: transport.sessionId,
            transportCount: Object.keys(this.transports).length,
          },
          "SSE transport created"
        );

        res.on("close", () => {
          logger.info(
            { sessionId: transport.sessionId },
            "SSE connection closed"
          );
          delete this.transports[transport.sessionId];
        });

        logger.debug(
          { sessionId: transport.sessionId },
          "Connecting transport to MCP server"
        );
        await this.server.connect(transport);
        logger.info(
          { sessionId: transport.sessionId },
          "Transport successfully connected to MCP server"
        );
      } catch (error) {
        logger.error(
          { error, stack: (error as Error).stack },
          "Error establishing SSE connection"
        );
        res.status(500).end();
      }
    });

    this.expressApp.post("/messages", async (req, res) => {
      try {
        const sessionId = req.query.sessionId as string;
        logger.debug(
          {
            sessionId,
            body: req.body,
            contentType: req.headers["content-type"],
          },
          "Received message for session"
        );

        const transport = this.transports[sessionId];
        if (transport) {
          logger.trace(
            { sessionId },
            "Found transport for session, handling message"
          );
          await transport.handlePostMessage(req, res);
          logger.trace({ sessionId }, "Message handled successfully");
        } else {
          logger.warn(
            {
              sessionId,
              availableSessions: Object.keys(this.transports),
            },
            "No transport found for session"
          );
          res.status(400).send("No transport found for sessionId");
        }
      } catch (error) {
        logger.error(
          { error, stack: (error as Error).stack },
          "Error handling message"
        );
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Add a simple discovery endpoint for clients
    this.expressApp.get("/", (req, res) => {
      logger.debug(
        { ip: req.ip, userAgent: req.headers["user-agent"] },
        "Received discovery request"
      );
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
    logger.debug({ port: this.port }, "Attempting to start MCP SSE server");

    try {
      this.httpServer = this.expressApp.listen(this.port, () => {
        logger.info(
          {
            port: this.port,
            serverName: this.serverName,
            serverVersion: this.serverVersion,
          },
          "MCP SSE server started successfully"
        );
      });

      this.httpServer.on("error", (error: Error) => {
        logger.error(
          {
            error,
            stack: error.stack,
            port: this.port,
          },
          "Error starting MCP SSE server"
        );
      });

      return this.httpServer;
    } catch (error) {
      logger.error(
        {
          error,
          stack: (error as Error).stack,
          port: this.port,
        },
        "Failed to start MCP SSE server"
      );
      throw error;
    }
  }

  public stop() {
    if (this.httpServer) {
      logger.debug("Stopping MCP SSE server");
      this.httpServer.close();
      logger.info("MCP SSE server stopped");
      this.httpServer = null;
    } else {
      logger.warn("Attempted to stop MCP SSE server, but it was not running");
    }
  }
}
