import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import { ObsidianStdioServer } from "../src/servers/mcp-server";

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

// Mock the StdioServerTransport
const mockConnect = mock(() => Promise.resolve());
mock.module("@modelcontextprotocol/sdk/server/stdio.js", () => {
  return {
    StdioServerTransport: class MockStdioServerTransport {
      constructor() {
        // Mock constructor
      }
    },
  };
});

// Test suite
let server: ObsidianStdioServer;

beforeEach(() => {
  // Create a new server for each test
  server = new ObsidianStdioServer({
    obsidianBaseUrl: "https://mock.obsidian.url",
    obsidianApiKey: "mock_api_key",
  });

  // Mock the connect method on the server instance
  (server as any).server.connect = mockConnect;
});

afterEach(() => {
  server.stop();
  mock.restore();
});

// Test server startup
test("should start server successfully", async () => {
  await server.start();
  expect(mockConnect).toHaveBeenCalledTimes(1);
});

// Test server shutdown
test("should stop server when stop is called", async () => {
  await server.start();
  server.stop();
  expect((server as any).isRunning).toBe(false);
});
