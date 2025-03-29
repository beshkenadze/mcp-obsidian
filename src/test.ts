#!/usr/bin/env bun

// Set NODE_TLS_REJECT_UNAUTHORIZED to 0 to bypass self-signed certificate validation
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import ObsidianClient from "./lib/obsidian-client";

// This is a simple test script to verify that the Obsidian client is working properly
// It requires that you have set the OBSIDIAN_API_KEY environment variable

// Get environment variables
const OBSIDIAN_BASE_URL =
  process.env.OBSIDIAN_BASE_URL || "https://127.0.0.1:27124";
const OBSIDIAN_API_KEY = process.env.OBSIDIAN_API_KEY;

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

    console.log("\nAll tests completed!");
  } catch (error) {
    console.error("Error during tests:", error);
  }
}

// Run the tests
runTests();
