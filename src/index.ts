// Set NODE_TLS_REJECT_UNAUTHORIZED to 0 to bypass self-signed certificate validation
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import McpServer from "./mcp-server";

// Environment variables for configuration
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const OBSIDIAN_BASE_URL =
  process.env.OBSIDIAN_BASE_URL || "https://127.0.0.1:27124";
const OBSIDIAN_API_KEY = process.env.OBSIDIAN_API_KEY || "";

// Check if API key is provided
if (!OBSIDIAN_API_KEY) {
  console.error("Error: OBSIDIAN_API_KEY environment variable is required");
  process.exit(1);
}

// Create and start the server
const server = new McpServer({
  port: PORT,
  obsidianBaseUrl: OBSIDIAN_BASE_URL,
  obsidianApiKey: OBSIDIAN_API_KEY,
});

server.start();
