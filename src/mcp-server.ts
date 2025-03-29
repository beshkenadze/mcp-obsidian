import ObsidianClient from "./lib/obsidian-client";

interface ServerConfig {
  port: number;
  obsidianBaseUrl: string;
  obsidianApiKey: string;
}

class McpServer {
  private obsidianClient: ObsidianClient;
  private port: number;
  private server: any;

  constructor(config: ServerConfig) {
    this.port = config.port;
    this.obsidianClient = new ObsidianClient({
      baseUrl: config.obsidianBaseUrl,
      apiKey: config.obsidianApiKey,
    });
  }

  private getServerConfig() {
    return {
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
    };
  }

  private async handleRequest(req: Request): Promise<Response> {
    // Parse URL
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Set CORS headers
    const headers = new Headers({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    });

    // Handle OPTIONS request for CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { headers, status: 204 });
    }

    // MCP discovery endpoint
    if (pathname === "/" && req.method === "GET") {
      const response = {
        schema_version: "v1",
        protocol: "mcp",
        server_name: "Obsidian MCP",
        server_version: "1.0.0",
        description: "MCP server for Obsidian interactions",
        ...this.getServerConfig(),
      };
      return new Response(JSON.stringify(response), { headers });
    }

    // Tool invocation endpoint
    if (pathname.startsWith("/tools/") && req.method === "POST") {
      try {
        const toolName = pathname.split("/tools/")[1];
        const body = (await req.json()) as { parameters?: Record<string, any> };
        const params = body.parameters || {};
        let result;

        switch (toolName) {
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
            result = await this.obsidianClient.appendToActiveFile(
              params.content
            );
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
            return new Response(
              JSON.stringify({ error: `Tool ${toolName} not found` }),
              { headers, status: 404 }
            );
        }

        return new Response(JSON.stringify({ result: result.data || result }), {
          headers,
        });
      } catch (error: any) {
        console.error(`Error executing tool:`, error);
        return new Response(
          JSON.stringify({
            error: `Error executing tool`,
            details: error.message,
          }),
          { headers, status: 500 }
        );
      }
    }

    // Not found
    return new Response(JSON.stringify({ error: "Endpoint not found" }), {
      headers,
      status: 404,
    });
  }

  public start() {
    this.server = Bun.serve({
      port: this.port,
      fetch: this.handleRequest.bind(this),
    });

    console.log(`MCP server running on port ${this.port}`);
  }

  public stop() {
    if (this.server) {
      this.server.stop();
    }
  }
}

export default McpServer;
