import cors from "cors";
import express from "express";
import ObsidianClient from "./lib/obsidian-client";

interface ServerConfig {
  port: number;
  obsidianBaseUrl: string;
  obsidianApiKey: string;
}

class McpServer {
  private app: express.Application;
  private obsidianClient: ObsidianClient;
  private port: number;

  constructor(config: ServerConfig) {
    this.app = express();
    this.port = config.port;
    this.obsidianClient = new ObsidianClient({
      baseUrl: config.obsidianBaseUrl,
      apiKey: config.obsidianApiKey,
    });

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private setupRoutes() {
    // MCP discovery endpoint
    this.app.get("/", (req, res) => {
      res.json({
        schema_version: "v1",
        protocol: "mcp",
        server_name: "Obsidian MCP",
        server_version: "1.0.0",
        description: "MCP server for Obsidian interactions",
        tools: [
          {
            name: "obsidian_get_status",
            description: "Get status information from Obsidian",
            parameters: {},
          },
          {
            name: "obsidian_get_active_file",
            description: "Get content of the currently active file in Obsidian",
            parameters: {},
          },
          {
            name: "obsidian_update_active_file",
            description:
              "Update the content of the currently active file in Obsidian",
            parameters: {
              content: {
                type: "string",
                description: "New content for the file",
              },
            },
          },
          {
            name: "obsidian_append_to_active_file",
            description:
              "Append content to the currently active file in Obsidian",
            parameters: {
              content: {
                type: "string",
                description: "Content to append",
              },
            },
          },
          {
            name: "obsidian_list_files",
            description: "List files in a directory",
            parameters: {
              path: {
                type: "string",
                description: "Path to list (relative to vault root)",
                default: "",
              },
            },
          },
          {
            name: "obsidian_get_file",
            description: "Get content of a file",
            parameters: {
              filename: {
                type: "string",
                description: "Path to the file (relative to vault root)",
              },
            },
          },
          {
            name: "obsidian_create_or_update_file",
            description: "Create a new file or update an existing one",
            parameters: {
              filename: {
                type: "string",
                description: "Path to the file (relative to vault root)",
              },
              content: {
                type: "string",
                description: "Content for the file",
              },
            },
          },
          {
            name: "obsidian_append_to_file",
            description: "Append content to a file",
            parameters: {
              filename: {
                type: "string",
                description: "Path to the file (relative to vault root)",
              },
              content: {
                type: "string",
                description: "Content to append",
              },
            },
          },
          {
            name: "obsidian_delete_file",
            description: "Delete a file",
            parameters: {
              filename: {
                type: "string",
                description: "Path to the file (relative to vault root)",
              },
            },
          },
          {
            name: "obsidian_search",
            description: "Search for content in vault",
            parameters: {
              query: {
                type: "string",
                description: "Search query",
              },
              contextLength: {
                type: "number",
                description: "How much context to include around matches",
                default: 100,
              },
            },
          },
          {
            name: "obsidian_open_document",
            description: "Open a document in Obsidian",
            parameters: {
              filename: {
                type: "string",
                description: "Path to the file (relative to vault root)",
              },
              newLeaf: {
                type: "boolean",
                description: "Whether to open in a new leaf",
                default: false,
              },
            },
          },
          {
            name: "obsidian_list_commands",
            description: "List available commands in Obsidian",
            parameters: {},
          },
          {
            name: "obsidian_execute_command",
            description: "Execute a command in Obsidian",
            parameters: {
              commandId: {
                type: "string",
                description: "ID of the command to execute",
              },
            },
          },
        ],
      });
    });

    // MCP tool invocation endpoint
    this.app.post("/tools/:tool_name", this.handleToolInvocation.bind(this));
  }

  private async handleToolInvocation(
    req: express.Request,
    res: express.Response
  ) {
    const { tool_name } = req.params;
    const params = req.body.parameters || {};

    try {
      let result;

      switch (tool_name) {
        case "obsidian_get_status":
          result = await this.obsidianClient.getStatus();
          break;

        case "obsidian_get_active_file":
          result = await this.obsidianClient.getActiveFile();
          break;

        case "obsidian_update_active_file":
          result = await this.obsidianClient.updateActiveFile(params.content);
          break;

        case "obsidian_append_to_active_file":
          result = await this.obsidianClient.appendToActiveFile(params.content);
          break;

        case "obsidian_list_files":
          result = await this.obsidianClient.listDirectory(params.path);
          break;

        case "obsidian_get_file":
          result = await this.obsidianClient.getFile(params.filename);
          break;

        case "obsidian_create_or_update_file":
          result = await this.obsidianClient.createOrUpdateFile(
            params.filename,
            params.content
          );
          break;

        case "obsidian_append_to_file":
          result = await this.obsidianClient.appendToFile(
            params.filename,
            params.content
          );
          break;

        case "obsidian_delete_file":
          result = await this.obsidianClient.deleteFile(params.filename);
          break;

        case "obsidian_search":
          result = await this.obsidianClient.search(
            params.query,
            params.contextLength
          );
          break;

        case "obsidian_open_document":
          result = await this.obsidianClient.openDocument(
            params.filename,
            params.newLeaf
          );
          break;

        case "obsidian_list_commands":
          result = await this.obsidianClient.getCommands();
          break;

        case "obsidian_execute_command":
          result = await this.obsidianClient.executeCommand(params.commandId);
          break;

        default:
          return res.status(404).json({ error: `Tool ${tool_name} not found` });
      }

      res.json({
        result: result.data || result,
      });
    } catch (error: any) {
      console.error(`Error executing tool ${tool_name}:`, error);
      res.status(500).json({
        error: `Error executing tool ${tool_name}`,
        details: error.message,
      });
    }
  }

  public start() {
    this.app.listen(this.port, () => {
      console.log(`MCP server running on port ${this.port}`);
    });
  }
}

export default McpServer;
