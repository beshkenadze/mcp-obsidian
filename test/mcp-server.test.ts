import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import McpServer from "../src/mcp-server";

// Mock the ObsidianClient class
mock.module("../src/lib/obsidian-client", () => {
  return {
    default: class MockObsidianClient {
      constructor() {
        // Mock constructor
      }

      // Mock methods with default responses
      getStatus() {
        return Promise.resolve({
          data: {
            authenticated: true,
            ok: "true",
            service: "obsidian",
            versions: { obsidian: "1.0.0", self: "0.1.0" },
          },
        });
      }

      getActiveFile() {
        return Promise.resolve({
          data: "# Active File Content",
        });
      }

      updateActiveFile() {
        return Promise.resolve({});
      }

      appendToActiveFile() {
        return Promise.resolve({});
      }

      listDirectory() {
        return Promise.resolve({
          data: {
            files: ["file1.md", "file2.md"],
          },
        });
      }

      getFile() {
        return Promise.resolve({
          data: "# File Content",
        });
      }

      createOrUpdateFile() {
        return Promise.resolve({});
      }

      appendToFile() {
        return Promise.resolve({});
      }

      deleteFile() {
        return Promise.resolve({});
      }

      search() {
        return Promise.resolve({
          data: {
            results: [{ file: "file1.md", matches: ["match 1"] }],
          },
        });
      }

      openDocument() {
        return Promise.resolve({});
      }

      getCommands() {
        return Promise.resolve({
          data: {
            commands: [{ id: "cmd1", name: "Command 1" }],
          },
        });
      }

      executeCommand() {
        return Promise.resolve({});
      }
    },
  };
});

// Mock the Bun.serve function
const mockServer = {
  stop: mock(() => {}),
};

// Keep a reference to the original Bun.serve
const originalBunServe = Bun.serve;

// Create a spy instead of directly mocking Bun.serve
const serveSpy = mock(() => mockServer);

// Test suite
let server: McpServer;
const TEST_PORT = 3000;

beforeEach(() => {
  // Create a new server for each test
  server = new McpServer({
    port: TEST_PORT,
    obsidianBaseUrl: "https://mock.obsidian.url",
    obsidianApiKey: "mock_api_key",
  });

  // Reset mocks
  (mockServer.stop as any).mockClear();
  serveSpy.mockClear();

  // Replace Bun.serve with our spy
  // @ts-ignore - we're intentionally mocking Bun.serve
  Bun.serve = serveSpy;
});

afterEach(() => {
  server.stop();
  // Restore the original Bun.serve
  Bun.serve = originalBunServe;
  mock.restore();
});

// Test server startup
test("should start server on specified port", () => {
  server.start();

  expect(serveSpy).toHaveBeenCalledTimes(1);
  const callArgs = serveSpy.mock.calls[0];
  if (callArgs && callArgs[0]) {
    expect(callArgs[0].port).toBe(TEST_PORT);
    expect(typeof callArgs[0].fetch).toBe("function");
  } else {
    expect(false).toBe(true); // Fail the test if callArgs doesn't exist
  }
});

// Test server shutdown
test("should stop server when stop is called", () => {
  server.start();
  server.stop();

  expect(mockServer.stop).toHaveBeenCalledTimes(1);
});

// Test request handling for discovery endpoint
test("should handle discovery endpoint request", async () => {
  const request = new Request("http://localhost:3000/");
  const response = await server["handleRequest"](request);

  expect(response.status).toBe(200);

  const jsonData = (await response.json()) as {
    protocol: string;
    server_name: string;
    schema_version: string;
    tools: any[];
  };

  expect(jsonData.protocol).toBe("mcp");
  expect(jsonData.server_name).toBe("Obsidian MCP");
  expect(jsonData.schema_version).toBe("v1");
  expect(Array.isArray(jsonData.tools)).toBe(true);
  expect(jsonData.tools.length).toBeGreaterThan(0);
});

// Test request handling for a tool invocation
test("should handle tool invocation request", async () => {
  const requestBody = JSON.stringify({ parameters: {} });
  const request = new Request(
    "http://localhost:3000/tools/obsidian_get_status",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: requestBody,
    }
  );

  const response = await server["handleRequest"](request);

  expect(response.status).toBe(200);

  const jsonData = (await response.json()) as {
    result: {
      authenticated: boolean;
      ok: string;
      service: string;
      versions: any;
    };
  };

  expect(jsonData.result).toBeDefined();
  expect(jsonData.result.authenticated).toBe(true);
});

// Test error handling for unknown tool
test("should return 404 for unknown tool", async () => {
  const requestBody = JSON.stringify({ parameters: {} });
  const request = new Request("http://localhost:3000/tools/nonexistent_tool", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: requestBody,
  });

  const response = await server["handleRequest"](request);

  expect(response.status).toBe(404);

  const jsonData = (await response.json()) as { error: string };
  expect(jsonData.error).toBeDefined();
});

// Test CORS handling with OPTIONS request
test("should handle OPTIONS request for CORS", async () => {
  const request = new Request(
    "http://localhost:3000/tools/obsidian_get_status",
    {
      method: "OPTIONS",
    }
  );

  const response = await server["handleRequest"](request);

  expect(response.status).toBe(204);
  expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
    "GET, POST, OPTIONS"
  );
});
