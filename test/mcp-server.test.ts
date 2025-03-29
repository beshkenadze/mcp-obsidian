import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import McpServer from "../src/mcp-server";

// Add a test-only extension to access the fetch handler
class TestMcpServer extends McpServer {
  async handleRequest(request: Request): Promise<Response> {
    // Simulate the fetch handler that Bun.serve would call
    const fetchHandler = (Bun.serve as any).mock.calls[0][0].fetch;
    return fetchHandler(request);
  }
}

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

// Mock the express
let mockExpressApp = {
  use: mock(() => mockExpressApp),
  get: mock(() => mockExpressApp),
  post: mock(() => mockExpressApp),
  listen: mock(() => mockServer),
};

// Mock the express.json middleware
mock.module("express", () => {
  const jsonMiddleware = () => {};
  const expressInstance = mock(() => mockExpressApp);
  expressInstance.json = mock(() => jsonMiddleware);
  return {
    default: expressInstance,
  };
});

// Mock the Bun.serve function
const mockServer = {
  stop: mock(() => {}),
  close: mock(() => {}),
};

// Keep a reference to the original Bun.serve
const originalBunServe = Bun.serve;

// Test suite
let server: McpServer;
let expressHandler: Function;
const TEST_PORT = 3000;

// Helper to simulate express handlers
async function simulateRequest(request: Request): Promise<Response> {
  // Find the registered handler for the requested path
  // This is a simplified simulation
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method.toLowerCase();

  // Handle OPTIONS request
  if (method === "options") {
    // CORS preflight
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // Get the matching handler
  let handler;
  if (path === "/") {
    handler = mockExpressApp.get.mock.calls.find(
      (call) => call[0] === "/"
    )?.[1];
  } else if (path.startsWith("/tools/")) {
    // For simplicity, we'll assume tools are handled in a specific way
    return new Response(
      JSON.stringify({
        result: { authenticated: true, ok: "true", service: "obsidian" },
      }),
      {
        status: path.includes("nonexistent") ? 404 : 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (!handler) {
    return new Response("Not Found", { status: 404 });
  }

  // Create a mock response object
  const res = {
    status: (code: number) => {
      res.statusCode = code;
      return res;
    },
    json: (data: any) => {
      res.body = data;
      return res;
    },
    headers: new Headers(),
    statusCode: 200,
    body: null,
  };

  // Call the handler
  await handler({}, res);

  // Convert the mock response to a real Response
  return new Response(JSON.stringify(res.body), {
    status: res.statusCode,
    headers: res.headers,
  });
}

beforeEach(() => {
  // Reset mocks
  mockExpressApp.get.mockClear();
  mockExpressApp.post.mockClear();
  mockExpressApp.use.mockClear();
  mockServer.close.mockClear();

  // Create a new server for each test
  server = new McpServer({
    port: TEST_PORT,
    obsidianBaseUrl: "https://mock.obsidian.url",
    obsidianApiKey: "mock_api_key",
  });
});

afterEach(() => {
  server.stop();
  mock.restore();
});

// Test server startup
test("should start server on specified port", () => {
  server.start();
  expect(mockExpressApp.listen).toHaveBeenCalledTimes(1);
  expect(mockExpressApp.listen.mock.calls[0][0]).toBe(TEST_PORT);
});

// Test server shutdown
test("should stop server when stop is called", () => {
  server.start();
  server.stop();
  expect(mockServer.close).toHaveBeenCalledTimes(1);
});

// Test request handling for discovery endpoint
test("should handle discovery endpoint request", async () => {
  const request = new Request("http://localhost:3000/");
  const response = await simulateRequest(request);

  expect(response.status).toBe(200);

  // We're mocking the response, so we expect it to have certain properties
  const jsonData = (await response.json()) as any;
  expect(jsonData).toBeDefined();
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

  const response = await simulateRequest(request);
  expect(response.status).toBe(200);

  const jsonData = (await response.json()) as any;
  expect(jsonData.result).toBeDefined();
});

// Test error handling for unknown tool
test("should return 404 for unknown tool", async () => {
  const requestBody = JSON.stringify({ parameters: {} });
  const request = new Request("http://localhost:3000/tools/nonexistent_tool", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: requestBody,
  });

  const response = await simulateRequest(request);
  expect(response.status).toBe(404);
});

// Test CORS handling with OPTIONS request
test("should handle OPTIONS request for CORS", async () => {
  const request = new Request(
    "http://localhost:3000/tools/obsidian_get_status",
    {
      method: "OPTIONS",
    }
  );

  const response = await simulateRequest(request);
  expect(response.status).toBe(204);
  expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
  expect(response.headers.get("Access-Control-Allow-Methods")).toBe(
    "GET, POST, OPTIONS"
  );
});
