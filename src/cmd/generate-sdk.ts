#!/usr/bin/env bun

import { createClient, defaultPlugins } from "@hey-api/openapi-ts";
import fs from "fs";
import path from "path";

// Ensure the output directory exists
const outputDir = path.resolve(process.cwd(), "src/lib/api");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Default paths
const defaultInputPath = path.resolve(process.cwd(), "api_docs/openapi.yaml");
const defaultOutputPath = path.resolve(outputDir, "");

// Get paths from command line args
const inputPath = process.argv[2] || defaultInputPath;
// Unused but kept for future use
const _outputDir2 = process.argv[3] || defaultOutputPath;

// Validate paths
if (!fs.existsSync(inputPath)) {
  console.error(`Error: Input file ${inputPath} does not exist`);
  process.exit(1);
}

console.log(`Generating Obsidian API SDK from ${inputPath} to ${outputDir}...`);

// Generate SDK using @hey-api/openapi-ts
try {
  await createClient({
    input: inputPath,
    output: outputDir,
    plugins: [
      ...defaultPlugins,
      "@hey-api/client-fetch",
      {
        name: "@hey-api/sdk",
        asClass: false, // Generate flat SDK for better tree-shaking
      },
    ],
  });
  console.log("Obsidian API SDK generated successfully!");
} catch (error) {
  console.error("Error generating SDK:", error);
  process.exit(1);
}
