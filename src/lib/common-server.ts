import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import logger from "./logger";
import ObsidianClient from "./obsidian-client";

export interface McpServerConfig {
  obsidianBaseUrl: string;
  obsidianApiKey: string;
  name?: string;
  version?: string;
}

export class CommonMcpServer {
  protected obsidianClient: ObsidianClient;
  protected server: McpServer;

  constructor(config: McpServerConfig) {
    this.obsidianClient = new ObsidianClient({
      baseUrl: config.obsidianBaseUrl,
      apiKey: config.obsidianApiKey,
    });

    // Initialize the MCP server
    this.server = new McpServer({
      name: config.name || "Obsidian MCP",
      version: config.version || "1.0.0",
    });

    // Configure all the tools
    this.configureMcpTools();
  }

  protected configureMcpTools() {
    // Status tool
    this.server.tool("obsidian_get_status", {}, async (_args) => {
      const result = await this.obsidianClient.getStatus();
      return this.formatToolResponse(result);
    });

    // Active file tools
    this.server.tool("obsidian_get_active_file", {}, async (_args) => {
      const result = await this.obsidianClient.getActiveFile();
      return this.formatToolResponse(result);
    });

    this.server.tool(
      "obsidian_update_active_file",
      {
        content: z.string().describe("New content for the file"),
      },
      async ({ content }) => {
        const result = await this.obsidianClient.updateActiveFile(content);
        return this.formatToolResponse(result);
      }
    );

    this.server.tool(
      "obsidian_append_to_active_file",
      {
        content: z.string().describe("Content to append"),
      },
      async ({ content }) => {
        const result = await this.obsidianClient.appendToActiveFile(content);
        return this.formatToolResponse(result);
      }
    );

    // File management tools
    this.server.tool(
      "obsidian_list_files",
      {
        path: z
          .string()
          .describe("Path to list (relative to vault root)")
          .default(""),
      },
      async ({ path }) => {
        const result = await this.obsidianClient.listDirectory(path);
        return this.formatToolResponse(result);
      }
    );

    this.server.tool(
      "obsidian_get_file",
      {
        filename: z
          .string()
          .describe("Path to the file (relative to vault root)"),
      },
      async ({ filename }) => {
        const result = await this.obsidianClient.getFile(filename);
        return this.formatToolResponse(result);
      }
    );

    this.server.tool(
      "obsidian_create_or_update_file",
      {
        filename: z
          .string()
          .describe("Path to the file (relative to vault root)"),
        content: z.string().describe("Content for the file"),
      },
      async ({ filename, content }) => {
        const result = await this.obsidianClient.createOrUpdateFile(
          filename,
          content
        );
        return this.formatToolResponse(result);
      }
    );

    this.server.tool(
      "obsidian_append_to_file",
      {
        filename: z
          .string()
          .describe("Path to the file (relative to vault root)"),
        content: z.string().describe("Content to append"),
      },
      async ({ filename, content }) => {
        const result = await this.obsidianClient.appendToFile(
          filename,
          content
        );
        return this.formatToolResponse(result);
      }
    );

    this.server.tool(
      "obsidian_delete_file",
      {
        filename: z
          .string()
          .describe("Path to the file (relative to vault root)"),
      },
      async ({ filename }) => {
        const result = await this.obsidianClient.deleteFile(filename);
        return this.formatToolResponse(result);
      }
    );

    // Search tool
    this.server.tool(
      "obsidian_search",
      {
        query: z.string().describe("Search query"),
        contextLength: z
          .number()
          .describe("How much context to include around matches")
          .default(100),
      },
      async ({ query, contextLength }) => {
        const result = await this.obsidianClient.search(query, contextLength);
        return this.formatToolResponse(result);
      }
    );

    // Document and command tools
    this.server.tool(
      "obsidian_open_document",
      {
        filename: z
          .string()
          .describe("Path to the file (relative to vault root)"),
        newLeaf: z
          .boolean()
          .describe("Whether to open in a new leaf")
          .default(false),
      },
      async ({ filename, newLeaf }) => {
        const result = await this.obsidianClient.openDocument(
          filename,
          newLeaf
        );
        return this.formatToolResponse(result);
      }
    );

    this.server.tool("obsidian_list_commands", {}, async (_args) => {
      const result = await this.obsidianClient.getCommands();
      return this.formatToolResponse(result);
    });

    this.server.tool(
      "obsidian_execute_command",
      {
        commandId: z.string().describe("ID of the command to execute"),
      },
      async ({ commandId }) => {
        const result = await this.obsidianClient.executeCommand(commandId);
        return this.formatToolResponse(result);
      }
    );
  }

  protected formatToolResponse(result: any) {
    let textContent: string;

    try {
      if (typeof result === "string") {
        textContent = result;
      } else if (result?.data !== undefined) {
        // Check if data exists and is not undefined
        if (typeof result.data === "string") {
          textContent = result.data;
        } else if (result.data === null) {
          textContent = ""; // Handle null data as empty string
        } else {
          textContent = JSON.stringify(result.data, null, 2);
        }
      } else {
        textContent = JSON.stringify(result, null, 2);
      }
    } catch (error) {
      logger.error({ error, result }, "Error formatting tool response");
      textContent = "Error formatting response data";
    }

    return {
      content: [
        {
          type: "text" as const,
          text: textContent,
        },
      ],
    };
  }
}
