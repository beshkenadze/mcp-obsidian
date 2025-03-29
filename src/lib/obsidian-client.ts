import https from "https";
import createClient from "openapi-fetch";
import type { paths } from "./api/types";

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
        ((url: Request | URL, init?: RequestInit) => {
          const fetchOptions = { ...init } as RequestInit;
          // @ts-ignore - httpsAgent is valid for Node.js environments
          fetchOptions.agent = httpsAgent;
          return fetch(url, fetchOptions);
        }),
    });
  }

  // Helper method to transform client responses to match ApiResponse type
  private transformResponse<T>(response: any): ApiResponse<T> {
    if (response.error) {
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
  async getStatus(): Promise<
    ApiResponse<
      paths["/"]["get"]["responses"]["200"]["content"]["application/json"]
    >
  > {
    const response = await this.client.GET("/");
    return this.transformResponse(response);
  }

  // Active File
  async getActiveFile(): Promise<ApiResponse<string>> {
    const response = await this.client.GET("/active/");
    return this.transformResponse(response);
  }

  async updateActiveFile(content: string): Promise<ApiResponse<void>> {
    const response = await this.client.PUT("/active/", {
      body: content,
    });
    return this.transformResponse(response);
  }

  async appendToActiveFile(content: string): Promise<ApiResponse<void>> {
    const response = await this.client.POST("/active/", {
      body: content,
    });
    return this.transformResponse(response);
  }

  async deleteActiveFile(): Promise<ApiResponse<void>> {
    const response = await this.client.DELETE("/active/");
    return this.transformResponse(response);
  }

  // Vault Files
  async getFile(filename: string): Promise<ApiResponse<string>> {
    const response = await this.client.GET("/vault/{filename}", {
      params: {
        path: {
          filename,
        },
      },
    });
    return this.transformResponse(response);
  }

  async createOrUpdateFile(
    filename: string,
    content: string
  ): Promise<ApiResponse<void>> {
    const response = await this.client.PUT("/vault/{filename}", {
      params: {
        path: {
          filename,
        },
      },
      body: content,
    });
    return this.transformResponse(response);
  }

  async appendToFile(
    filename: string,
    content: string
  ): Promise<ApiResponse<void>> {
    const response = await this.client.POST("/vault/{filename}", {
      params: {
        path: {
          filename,
        },
      },
      body: content,
    });
    return this.transformResponse(response);
  }

  async deleteFile(filename: string): Promise<ApiResponse<void>> {
    const response = await this.client.DELETE("/vault/{filename}", {
      params: {
        path: {
          filename,
        },
      },
    });
    return this.transformResponse(response);
  }

  // Directories
  async listDirectory(
    path: string = ""
  ): Promise<
    ApiResponse<
      paths["/vault/"]["get"]["responses"]["200"]["content"]["application/json"]
    >
  > {
    let response;
    if (path === "") {
      response = await this.client.GET("/vault/");
    } else {
      response = await this.client.GET("/vault/{pathToDirectory}/", {
        params: {
          path: {
            pathToDirectory: path,
          },
        },
      });
    }
    return this.transformResponse(response);
  }

  // Commands
  async getCommands(): Promise<
    ApiResponse<
      paths["/commands/"]["get"]["responses"]["200"]["content"]["application/json"]
    >
  > {
    const response = await this.client.GET("/commands/");
    return this.transformResponse(response);
  }

  async executeCommand(commandId: string): Promise<ApiResponse<void>> {
    const response = await this.client.POST("/commands/{commandId}/", {
      params: {
        path: {
          commandId,
        },
      },
    });
    return this.transformResponse(response);
  }

  // Search
  async search(
    query: string,
    contextLength: number = 100
  ): Promise<ApiResponse<any>> {
    const response = await this.client.POST("/search/simple/", {
      params: {
        query: {
          query,
          contextLength,
        },
      },
    });
    return this.transformResponse(response);
  }

  // Open document
  async openDocument(
    filename: string,
    newLeaf: boolean = false
  ): Promise<ApiResponse<any>> {
    const response = await this.client.POST("/open/{filename}", {
      params: {
        path: {
          filename,
        },
        query: {
          newLeaf,
        },
      },
    });
    return this.transformResponse(response);
  }

  // Periodic Notes
  async getPeriodicNote(
    period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly"
  ): Promise<ApiResponse<string>> {
    const response = await this.client.GET("/periodic/{period}/", {
      params: {
        path: {
          period,
        },
      },
    });
    return this.transformResponse(response);
  }

  async appendToPeriodicNote(
    period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly",
    content: string
  ): Promise<ApiResponse<void>> {
    const response = await this.client.POST("/periodic/{period}/", {
      params: {
        path: {
          period,
        },
      },
      body: content,
    });
    return this.transformResponse(response);
  }
}

export default ObsidianClient;
