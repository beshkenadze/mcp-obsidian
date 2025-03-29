import https from "https";
import createClient from "openapi-fetch";
import type { paths } from "./api/types";

export interface ObsidianClientConfig {
  baseUrl: string;
  apiKey: string;
  fetch?: (url: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
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
  private client: ReturnType<typeof createClient<paths>>;

  constructor(config: ObsidianClientConfig) {
    // Create an HTTPS agent that doesn't reject self-signed certificates
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    });

    this.client = createClient<paths>({
      baseUrl: config.baseUrl,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "text/markdown",
      },
      // Use the HTTPS agent for requests or custom fetch if provided
      fetch:
        config.fetch ||
        ((url, init) => fetch(url, { ...init, agent: httpsAgent })),
    });
  }

  // Status
  async getStatus(): Promise<
    ApiResponse<
      paths["/"]["get"]["responses"]["200"]["content"]["application/json"]
    >
  > {
    return this.client.GET("/");
  }

  // Active File
  async getActiveFile(): Promise<ApiResponse<string>> {
    return this.client.GET("/active/");
  }

  async updateActiveFile(content: string): Promise<ApiResponse<void>> {
    return this.client.PUT("/active/", {
      body: content,
    });
  }

  async appendToActiveFile(content: string): Promise<ApiResponse<void>> {
    return this.client.POST("/active/", {
      body: content,
    });
  }

  async deleteActiveFile(): Promise<ApiResponse<void>> {
    return this.client.DELETE("/active/");
  }

  // Vault Files
  async getFile(filename: string): Promise<ApiResponse<string>> {
    return this.client.GET("/vault/{filename}", {
      params: {
        path: {
          filename,
        },
      },
    });
  }

  async createOrUpdateFile(
    filename: string,
    content: string
  ): Promise<ApiResponse<void>> {
    return this.client.PUT("/vault/{filename}", {
      params: {
        path: {
          filename,
        },
      },
      body: content,
    });
  }

  async appendToFile(
    filename: string,
    content: string
  ): Promise<ApiResponse<void>> {
    return this.client.POST("/vault/{filename}", {
      params: {
        path: {
          filename,
        },
      },
      body: content,
    });
  }

  async deleteFile(filename: string): Promise<ApiResponse<void>> {
    return this.client.DELETE("/vault/{filename}", {
      params: {
        path: {
          filename,
        },
      },
    });
  }

  // Directories
  async listDirectory(
    path: string = ""
  ): Promise<
    ApiResponse<
      paths["/vault/"]["get"]["responses"]["200"]["content"]["application/json"]
    >
  > {
    if (path === "") {
      return this.client.GET("/vault/");
    } else {
      return this.client.GET("/vault/{pathToDirectory}/", {
        params: {
          path: {
            pathToDirectory: path,
          },
        },
      });
    }
  }

  // Commands
  async getCommands(): Promise<
    ApiResponse<
      paths["/commands/"]["get"]["responses"]["200"]["content"]["application/json"]
    >
  > {
    return this.client.GET("/commands/");
  }

  async executeCommand(commandId: string): Promise<ApiResponse<void>> {
    return this.client.POST("/commands/{commandId}/", {
      params: {
        path: {
          commandId,
        },
      },
    });
  }

  // Search
  async search(
    query: string,
    contextLength: number = 100
  ): Promise<ApiResponse<any>> {
    return this.client.POST("/search/simple/", {
      params: {
        query: {
          query,
          contextLength,
        },
      },
    });
  }

  // Open document
  async openDocument(
    filename: string,
    newLeaf: boolean = false
  ): Promise<ApiResponse<any>> {
    return this.client.POST("/open/{filename}", {
      params: {
        path: {
          filename,
        },
        query: {
          newLeaf,
        },
      },
    });
  }

  // Periodic Notes
  async getPeriodicNote(
    period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly"
  ): Promise<ApiResponse<string>> {
    return this.client.GET("/periodic/{period}/", {
      params: {
        path: {
          period,
        },
      },
    });
  }

  async appendToPeriodicNote(
    period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly",
    content: string
  ): Promise<ApiResponse<void>> {
    return this.client.POST("/periodic/{period}/", {
      params: {
        path: {
          period,
        },
      },
      body: content,
    });
  }
}

export default ObsidianClient;
