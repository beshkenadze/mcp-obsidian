#!/usr/bin/env bun

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Ensure the output directory exists
const outputDir = path.resolve(process.cwd(), "src/lib/api");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Default paths
const defaultInputPath = path.resolve(process.cwd(), "api_docs/openapi.yaml");
const defaultOutputPath = path.resolve(outputDir, "types.d.ts");

// Get paths from command line args
const inputPath = process.argv[2] || defaultInputPath;
const outputPath = process.argv[3] || defaultOutputPath;

// Validate paths
if (!fs.existsSync(inputPath)) {
  console.error(`Error: Input file ${inputPath} does not exist`);
  process.exit(1);
}

console.log(
  `Generating TypeScript types from ${inputPath} to ${outputPath}...`
);

// Generate types using openapi-typescript
try {
  execSync(`bunx openapi-typescript ${inputPath} -o ${outputPath}`, {
    stdio: "inherit",
  });
  console.log("TypeScript types generated successfully!");
} catch (error) {
  console.error("Error generating TypeScript types:", error);
  process.exit(1);
}
