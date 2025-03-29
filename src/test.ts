#!/usr/bin/env bun

// Set NODE_TLS_REJECT_UNAUTHORIZED to 0 to bypass self-signed certificate validation
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import ObsidianClient from "./lib/obsidian-client";
import McpServer from "./mcp-server";

// This is a simple test script to verify that the Obsidian client is working properly
// It requires that you have set the OBSIDIAN_API_KEY environment variable

// Get environment variables
const OBSIDIAN_BASE_URL =
  process.env.OBSIDIAN_BASE_URL || "https://127.0.0.1:27124";
const OBSIDIAN_API_KEY = process.env.OBSIDIAN_API_KEY || "";
const MCP_TEST_PORT = 3100;

// Check if API key is provided
if (!OBSIDIAN_API_KEY) {
  console.error("Error: OBSIDIAN_API_KEY environment variable is required");
  process.exit(1);
}

// Create Obsidian client
const client = new ObsidianClient({
  baseUrl: OBSIDIAN_BASE_URL,
  apiKey: OBSIDIAN_API_KEY,
});

// Helper function to test the MCP server
async function testMcpServer() {
  console.log("\n--- Testing MCP Server ---");

  // Initialize the MCP server
  const mcpServer = new McpServer({
    port: MCP_TEST_PORT,
    obsidianBaseUrl: OBSIDIAN_BASE_URL,
    obsidianApiKey: OBSIDIAN_API_KEY,
  });

  // Start the server
  console.log(`Starting MCP server on port ${MCP_TEST_PORT}...`);
  mcpServer.start();

  try {
    // Test discovery endpoint
    console.log("Testing discovery endpoint...");
    const discoveryResponse = await fetch(`http://localhost:${MCP_TEST_PORT}/`);
    const discoveryData = (await discoveryResponse.json()) as {
      server_name: string;
      tools: Array<any>;
    };
    console.log(
      "Discovery endpoint response status:",
      discoveryResponse.status
    );
    console.log("Server name:", discoveryData.server_name);
    console.log("Number of tools:", discoveryData.tools.length);

    // Test a tool invocation
    console.log("\nTesting tool invocation...");
    const statusResponse = await fetch(
      `http://localhost:${MCP_TEST_PORT}/tools/obsidian_get_status`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ parameters: {} }),
      }
    );
    const statusData = (await statusResponse.json()) as {
      result?: any;
      error?: string;
    };
    console.log("Tool invocation status:", statusResponse.status);
    console.log("Response contains result:", statusData.result ? "Yes" : "No");

    console.log("\nMCP Server tests completed successfully!");
  } catch (error) {
    console.error("Error testing MCP server:", error);
  } finally {
    // Stop the server
    console.log("Stopping MCP server...");
    mcpServer.stop();
  }
}

// Run tests
async function runTests() {
  try {
    console.log("Testing Obsidian API client...");

    // Test getStatus
    console.log("\n--- Testing getStatus ---");
    const statusResult = await client.getStatus();
    if (statusResult.error) {
      console.error("Error getting status:", statusResult.error);
    } else if (statusResult.data) {
      console.log("Status:", statusResult.data);
    }

    // Test listDirectory
    console.log("\n--- Testing listDirectory (root) ---");
    const dirResult = await client.listDirectory();
    if (dirResult.error) {
      console.error("Error listing directory:", dirResult.error);
    } else if (dirResult.data && dirResult.data.files) {
      console.log("Files in root directory:", dirResult.data.files.length);
      console.log("Sample files:", dirResult.data.files.slice(0, 5));
    }

    // Test getCommands
    console.log("\n--- Testing getCommands ---");
    const commandsResult = await client.getCommands();
    if (commandsResult.error) {
      console.error("Error getting commands:", commandsResult.error);
    } else if (commandsResult.data && commandsResult.data.commands) {
      console.log("Commands:", commandsResult.data.commands.length);
      console.log("Sample commands:", commandsResult.data.commands.slice(0, 5));
    }

    // Test MCP server
    await testMcpServer();

    console.log("\nAll tests completed!");
  } catch (error) {
    console.error("Error during tests:", error);
  }
}

// Run the tests
runTests();
