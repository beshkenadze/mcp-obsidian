#!/usr/bin/env bun
import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import logger from "../lib/logger";

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../");

// Default port for SSE server
const PORT = process.env.PORT || "3001";

// Function to load environment variables from .env file
async function loadEnv(): Promise<void> {
  try {
    // Import environment variables from .env file using Bun
    const envFile = Bun.file(path.join(projectRoot, ".env"));
    const env = await envFile.text();
    const envVars = env
      .split("\n")
      .filter((line: string) => line.trim() !== "" && !line.startsWith("#"))
      .reduce((acc: Record<string, string>, line: string) => {
        const [key, ...valueParts] = line.split("=");
        const value = valueParts.join("=");
        if (key && value) {
          acc[key.trim()] = value.trim();
        }
        return acc;
      }, {});

    // Set environment variables
    Object.entries(envVars).forEach(([key, value]) => {
      process.env[key] = process.env[key] || value;
    });
  } catch (error) {
    logger.warn(
      "Failed to load .env file. Using default environment variables."
    );
  }
}

// Check if supergateway is installed
function checkSupergateway(): boolean {
  try {
    execSync("npx supergateway --help", { stdio: "ignore" });
    return true;
  } catch (error) {
    return false;
  }
}

// Main function
async function main(): Promise<void> {
  logger.info("Starting MCP server with supergateway for SSE...");

  await loadEnv();

  if (!checkSupergateway()) {
    logger.error(
      'supergateway not found. Please install it with "bun add supergateway"'
    );
    process.exit(1);
  }

  const port = PORT;

  // Set environment variables for the MCP server
  const env = {
    ...process.env,
    MCP_TRANSPORT: "stdio", // Ensure we use stdio transport for supergateway
    LOG_TO_CONSOLE: "true",
    OBSIDIAN_API_KEY: process.env.OBSIDIAN_API_KEY || "",
  };

  // Create a temporary shell script to run the MCP server
  const tempScriptPath = path.join(projectRoot, "temp_mcp_script.sh");
  fs.writeFileSync(
    tempScriptPath,
    `#!/bin/bash
cd "${projectRoot}"
export MCP_TRANSPORT=stdio
export LOG_TO_CONSOLE=true
export OBSIDIAN_API_KEY="${process.env.OBSIDIAN_API_KEY || ""}"
export OBSIDIAN_BASE_URL="${
      process.env.OBSIDIAN_BASE_URL || "https://127.0.0.1:27124"
    }"
bun src/index.ts
`,
    { mode: 0o755 }
  );

  logger.info(`Starting supergateway with stdio MCP server on port ${port}...`);

  // Start supergateway with the MCP server
  const supergateway = spawn(
    "npx",
    ["supergateway", "--stdio", tempScriptPath, "--port", port, "--cors"],
    {
      stdio: "inherit",
      shell: true,
      env,
      cwd: projectRoot,
    }
  );

  // Handle cleanup
  const cleanup = () => {
    try {
      if (fs.existsSync(tempScriptPath)) {
        fs.unlinkSync(tempScriptPath);
      }
    } catch (error) {
      logger.error(`Failed to remove temporary script: ${error}`);
    }
  };

  supergateway.on("error", (error: Error) => {
    logger.error(`Failed to start supergateway: ${error.message}`);
    cleanup();
    process.exit(1);
  });

  supergateway.on("exit", () => {
    cleanup();
  });

  process.on("SIGINT", () => {
    logger.info("Received SIGINT, shutting down...");
    supergateway.kill("SIGINT");
    cleanup();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    logger.info("Received SIGTERM, shutting down...");
    supergateway.kill("SIGTERM");
    cleanup();
    process.exit(0);
  });
}

main().catch((error: Error) => {
  logger.error(`Error running MCP server with supergateway: ${error.message}`);
  process.exit(1);
});
