import { createClient, createConfig } from "@hey-api/client-fetch";
import https from "https";
import * as ObsidianSDK from "./api"; // Import the SDK
import logger from "./logger";

export interface ObsidianClientConfig {
  baseUrl: string;
  apiKey: string;
  fetch?: (url: Request | URL, init?: RequestInit) => Promise<Response>;
}

// Create a type for the response data
export type ApiResponse<T> = {
  data?: T;
  error?: {
    status: number;
    statusText: string;
    data?: any;
  };
};

export class ObsidianClient {
  // Expose these as public to allow access from server classes
  public client: ReturnType<typeof createClient>;
  public sdk: typeof ObsidianSDK;

  constructor(config: ObsidianClientConfig) {
    // Create an HTTPS agent that doesn't reject self-signed certificates
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    // Create the client
    this.client = createClient(
      createConfig({
        baseUrl: config.baseUrl,
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "text/markdown",
        },
        // Use the HTTPS agent for requests or custom fetch if provided
        fetch:
          config.fetch ||
          ((url: Request | URL, init?: RequestInit) => {
            const fetchOptions = { ...init } as RequestInit;
            // @ts-ignore - httpsAgent is valid for Node.js environments
            fetchOptions.agent = httpsAgent;
            return fetch(url, fetchOptions);
          }),
      })
    );

    // Attach SDK
    this.sdk = ObsidianSDK;
  }

  // Helper method to transform client responses to match ApiResponse type
  private transformResponse<T>(response: any): ApiResponse<T> {
    if (response.error) {
      logger.error(
        {
          status: response.response?.status || 500,
          statusText: response.response?.statusText || "Error",
          error: response.error,
        },
        "API error response"
      );

      return {
        error: {
          status: response.response?.status || 500,
          statusText: response.response?.statusText || "Error",
          data: response.error,
        },
      };
    }
    return { data: response.data };
  }

  // Status
  async getStatus(): Promise<ApiResponse<any>> {
    logger.debug("Getting Obsidian status");
    const response = await this.sdk.get({ client: this.client });
    return this.transformResponse(response);
  }

  // Active File
  async getActiveFile(): Promise<ApiResponse<string>> {
    logger.debug("Getting active file content");
    const response = await this.sdk.getActive({ client: this.client });
    return this.transformResponse(response);
  }

  async updateActiveFile(content: string): Promise<ApiResponse<void>> {
    logger.debug("Updating active file");
    const response = await this.sdk.putActive({
      client: this.client,
      body: content,
    });
    return this.transformResponse(response);
  }

  async appendToActiveFile(content: string): Promise<ApiResponse<void>> {
    logger.debug("Appending to active file");
    const response = await this.sdk.postActive({
      client: this.client,
      body: content,
    });
    return this.transformResponse(response);
  }

  async deleteActiveFile(): Promise<ApiResponse<void>> {
    logger.debug("Deleting active file");
    const response = await this.sdk.deleteActive({ client: this.client });
    return this.transformResponse(response);
  }

  // Vault Files
  async getFile(filename: string): Promise<ApiResponse<string>> {
    logger.debug({ filename }, "Getting file content");
    const response = await this.sdk.getVaultByFilename({
      client: this.client,
      path: {
        filename,
      },
    });
    return this.transformResponse(response);
  }

  async createOrUpdateFile(
    filename: string,
    content: string
  ): Promise<ApiResponse<void>> {
    logger.debug({ filename }, "Creating or updating file");
    const response = await this.sdk.putVaultByFilename({
      client: this.client,
      path: {
        filename,
      },
      body: content,
    });
    return this.transformResponse(response);
  }

  async appendToFile(
    filename: string,
    content: string
  ): Promise<ApiResponse<void>> {
    logger.debug({ filename }, "Appending to file");
    const response = await this.sdk.postVaultByFilename({
      client: this.client,
      path: {
        filename,
      },
      body: content,
    });
    return this.transformResponse(response);
  }

  async deleteFile(filename: string): Promise<ApiResponse<void>> {
    logger.debug({ filename }, "Deleting file");
    const response = await this.sdk.deleteVaultByFilename({
      client: this.client,
      path: {
        filename,
      },
    });
    return this.transformResponse(response);
  }

  // Directories
  async listDirectory(path: string = ""): Promise<ApiResponse<any>> {
    logger.debug({ path: path || "root" }, "Listing directory");
    let response;
    if (path === "") {
      response = await this.sdk.getVault({ client: this.client });
    } else {
      response = await this.sdk.getVaultByPathToDirectory({
        client: this.client,
        path: {
          pathToDirectory: path,
        },
      });
    }
    return this.transformResponse(response);
  }

  // Commands
  async getCommands(): Promise<ApiResponse<any>> {
    logger.debug("Getting Obsidian commands");
    const response = await this.sdk.getCommands({ client: this.client });
    return this.transformResponse(response);
  }

  async executeCommand(commandId: string): Promise<ApiResponse<void>> {
    logger.debug({ commandId }, "Executing command");
    const response = await this.sdk.postCommandsByCommandId({
      client: this.client,
      path: {
        commandId,
      },
    });
    return this.transformResponse(response);
  }

  // Search
  async search(
    query: string,
    contextLength: number = 100
  ): Promise<ApiResponse<any>> {
    logger.debug({ query, contextLength }, "Searching vault");
    const response = await this.sdk.postSearchSimple({
      client: this.client,
      query: {
        query,
        contextLength,
      },
    });
    return this.transformResponse(response);
  }

  // Open document
  async openDocument(
    filename: string,
    newLeaf: boolean = false
  ): Promise<ApiResponse<any>> {
    logger.debug({ filename, newLeaf }, "Opening document");
    const response = await this.sdk.postOpenByFilename({
      client: this.client,
      path: {
        filename,
      },
      query: {
        newLeaf,
      },
    });
    return this.transformResponse(response);
  }

  // Periodic Notes
  async getPeriodicNote(
    period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly"
  ): Promise<ApiResponse<string>> {
    logger.debug({ period }, "Getting periodic note");
    const response = await this.sdk.getPeriodicByPeriod({
      client: this.client,
      path: {
        period,
      },
    });
    return this.transformResponse(response);
  }

  async appendToPeriodicNote(
    period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly",
    content: string
  ): Promise<ApiResponse<void>> {
    logger.debug({ period }, "Appending to periodic note");
    const response = await this.sdk.postPeriodicByPeriod({
      client: this.client,
      path: {
        period,
      },
      body: content,
    });
    return this.transformResponse(response);
  }
}

export default ObsidianClient;
