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

    this.server.tool(
      "obsidian_patch_active_file",
      {
        operation: z
          .enum(["append", "prepend", "replace"])
          .describe("Patch operation to perform"),
        targetType: z
          .enum(["heading", "block", "frontmatter"])
          .describe("Type of target to patch"),
        target: z.string().describe("Target to patch"),
        content: z.string().describe("Content to insert"),
        targetDelimiter: z
          .string()
          .optional()
          .describe("Delimiter for nested targets (i.e. Headings)"),
        trimTargetWhitespace: z
          .boolean()
          .optional()
          .describe("Trim whitespace from Target before applying patch?"),
      },
      async ({
        operation,
        targetType,
        target,
        content,
        targetDelimiter,
        trimTargetWhitespace,
      }) => {
        // Create the headers explicitly typed
        const headers = {
          Operation: operation,
          "Target-Type": targetType,
          Target: target,
        } as const;

        // Add optional headers
        const options: any = {
          client: this.obsidianClient.client,
          headers,
          body: content,
        };

        if (targetDelimiter) {
          options.headers = {
            ...options.headers,
            "Target-Delimiter": targetDelimiter,
          };
        }

        if (trimTargetWhitespace !== undefined) {
          options.headers = {
            ...options.headers,
            "Trim-Target-Whitespace": trimTargetWhitespace ? "true" : "false",
          };
        }

        const response = await this.obsidianClient.sdk.patchActive(options);

        return this.formatToolResponse(response);
      }
    );

    this.server.tool("obsidian_delete_active_file", {}, async () => {
      const result = await this.obsidianClient.deleteActiveFile();
      return this.formatToolResponse(result);
    });

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
      "obsidian_patch_file",
      {
        filename: z
          .string()
          .describe("Path to the file (relative to vault root)"),
        operation: z
          .enum(["append", "prepend", "replace"])
          .describe("Patch operation to perform"),
        targetType: z
          .enum(["heading", "block", "frontmatter"])
          .describe("Type of target to patch"),
        target: z.string().describe("Target to patch"),
        content: z.string().describe("Content to insert"),
        targetDelimiter: z
          .string()
          .optional()
          .describe("Delimiter for nested targets (i.e. Headings)"),
        trimTargetWhitespace: z
          .boolean()
          .optional()
          .describe("Trim whitespace from Target before applying patch?"),
      },
      async ({
        filename,
        operation,
        targetType,
        target,
        content,
        targetDelimiter,
        trimTargetWhitespace,
      }) => {
        // Create the headers explicitly typed
        const headers = {
          Operation: operation,
          "Target-Type": targetType,
          Target: target,
        } as const;

        // Add optional headers
        const options: any = {
          client: this.obsidianClient.client,
          path: { filename },
          headers,
          body: content,
        };

        if (targetDelimiter) {
          options.headers = {
            ...options.headers,
            "Target-Delimiter": targetDelimiter,
          };
        }

        if (trimTargetWhitespace !== undefined) {
          options.headers = {
            ...options.headers,
            "Trim-Target-Whitespace": trimTargetWhitespace ? "true" : "false",
          };
        }

        const response = await this.obsidianClient.sdk.patchVaultByFilename(
          options
        );

        return this.formatToolResponse(response);
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

    // Periodic Notes tools
    this.server.tool(
      "obsidian_get_periodic_note",
      {
        period: z
          .enum(["daily", "weekly", "monthly", "quarterly", "yearly"])
          .describe("Type of periodic note"),
      },
      async ({ period }) => {
        const result = await this.obsidianClient.getPeriodicNote(period);
        return this.formatToolResponse(result);
      }
    );

    this.server.tool(
      "obsidian_update_periodic_note",
      {
        period: z
          .enum(["daily", "weekly", "monthly", "quarterly", "yearly"])
          .describe("Type of periodic note"),
        content: z.string().describe("New content for the note"),
      },
      async ({ period, content }) => {
        const response = await this.obsidianClient.sdk.putPeriodicByPeriod({
          client: this.obsidianClient.client,
          path: { period },
          body: content,
        });
        return this.formatToolResponse(response);
      }
    );

    this.server.tool(
      "obsidian_append_to_periodic_note",
      {
        period: z
          .enum(["daily", "weekly", "monthly", "quarterly", "yearly"])
          .describe("Type of periodic note"),
        content: z.string().describe("Content to append"),
      },
      async ({ period, content }) => {
        const result = await this.obsidianClient.appendToPeriodicNote(
          period,
          content
        );
        return this.formatToolResponse(result);
      }
    );

    this.server.tool(
      "obsidian_delete_periodic_note",
      {
        period: z
          .enum(["daily", "weekly", "monthly", "quarterly", "yearly"])
          .describe("Type of periodic note"),
      },
      async ({ period }) => {
        const response = await this.obsidianClient.sdk.deletePeriodicByPeriod({
          client: this.obsidianClient.client,
          path: { period },
        });
        return this.formatToolResponse(response);
      }
    );

    this.server.tool(
      "obsidian_patch_periodic_note",
      {
        period: z
          .enum(["daily", "weekly", "monthly", "quarterly", "yearly"])
          .describe("Type of periodic note"),
        operation: z
          .enum(["append", "prepend", "replace"])
          .describe("Patch operation to perform"),
        targetType: z
          .enum(["heading", "block", "frontmatter"])
          .describe("Type of target to patch"),
        target: z.string().describe("Target to patch"),
        content: z.string().describe("Content to insert"),
        targetDelimiter: z
          .string()
          .optional()
          .describe("Delimiter for nested targets (i.e. Headings)"),
        trimTargetWhitespace: z
          .boolean()
          .optional()
          .describe("Trim whitespace from Target before applying patch?"),
      },
      async ({
        period,
        operation,
        targetType,
        target,
        content,
        targetDelimiter,
        trimTargetWhitespace,
      }) => {
        // Create the headers explicitly typed
        const headers = {
          Operation: operation,
          "Target-Type": targetType,
          Target: target,
        } as const;

        // Add optional headers
        const options: any = {
          client: this.obsidianClient.client,
          path: { period },
          headers,
          body: content,
        };

        if (targetDelimiter) {
          options.headers = {
            ...options.headers,
            "Target-Delimiter": targetDelimiter,
          };
        }

        if (trimTargetWhitespace !== undefined) {
          options.headers = {
            ...options.headers,
            "Trim-Target-Whitespace": trimTargetWhitespace ? "true" : "false",
          };
        }

        const response = await this.obsidianClient.sdk.patchPeriodicByPeriod(
          options
        );

        return this.formatToolResponse(response);
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

    // Advanced search (using JsonLogic or Dataview)
    this.server.tool(
      "obsidian_advanced_search",
      {
        query: z
          .any()
          .describe("Search query (JsonLogic object or Dataview query string)"),
        searchType: z
          .enum(["jsonlogic", "dataview"])
          .describe("Type of search query"),
      },
      async ({ query, searchType }) => {
        const contentType =
          searchType === "jsonlogic"
            ? "application/vnd.olrapi.jsonlogic+json"
            : "application/vnd.olrapi.dataview.dql+txt";

        const queryBody =
          typeof query === "string" ? query : JSON.stringify(query);

        // We need to use any type to handle the body correctly
        const options: any = {
          client: this.obsidianClient.client,
          headers: { "Content-Type": contentType },
          body: queryBody,
        };

        const response = await this.obsidianClient.sdk.postSearch(options);

        return this.formatToolResponse(response);
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
