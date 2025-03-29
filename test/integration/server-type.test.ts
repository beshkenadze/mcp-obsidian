import { afterEach, describe, expect, test } from "bun:test";
import fetch from "node-fetch";
import McpServer from "../../src/mcp-server";

describe("Server Type Test", () => {
  const PORT = 3456;
  let server: McpServer;

  // Mock the obsidian client to avoid actual API calls
  const mockObsidianClient = {
    getStatus: async () => ({ status: "ok", version: "test" }),
    getActiveFile: async () => null,
    // Other methods would be mocked here as needed
  };

  afterEach(() => {
    if (server) {
      server.stop();
    }
  });

  async function testServerDiscovery(serverType: "bun" | "express") {
    // Create a server instance with the specified type
    server = new McpServer({
      port: PORT,
      obsidianBaseUrl: "https://localhost:27124",
      obsidianApiKey: "test",
      serverType,
    });

    // Replace obsidianClient with mock
    (server as any).obsidianClient = mockObsidianClient;

    // Start the server
    server.start();

    // Test that the server responds to the discovery endpoint
    const response = await fetch(`http://localhost:${PORT}/`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.schema_version).toBe("v1");
    expect(data.protocol).toBe("mcp");
    expect(data.server_name).toBe("Obsidian MCP");

    // Test a tool endpoint
    const toolResponse = await fetch(
      `http://localhost:${PORT}/tools/obsidian_get_status`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ parameters: {} }),
      }
    );

    expect(toolResponse.status).toBe(200);
    const toolData = await toolResponse.json();
    expect(toolData.result).toHaveProperty("status", "ok");

    // Stop the server
    server.stop();
  }

  test("Bun server responds to discovery endpoint", async () => {
    await testServerDiscovery("bun");
  });

  test("Express server responds to discovery endpoint", async () => {
    await testServerDiscovery("express");
  });
});
