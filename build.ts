import type { BuildConfig, BuildOutput } from "bun";
import { build } from "bun";
import { mkdir } from "fs/promises";

// Ensure dist directory exists
await mkdir("dist", { recursive: true });

// Common build configuration
const commonConfig: BuildConfig = {
  entrypoints: [],
  outdir: "./dist",
  target: "bun",
  format: "esm",
  minify: process.env.NODE_ENV === "production",
  sourcemap: process.env.NODE_ENV !== "production" ? "external" : "none",
  external: ["@modelcontextprotocol/sdk", "express", "zod"],
};

// Build the main entry point that exports everything
console.log("📦 Building main bundle...");
const mainBuild = await build({
  ...commonConfig,
  entrypoints: ["./src/index.ts"],
});
reportBuildResult(mainBuild, "Main bundle");

// Build the server modules individually
console.log("📦 Building server modules...");
const serverBuild = await build({
  ...commonConfig,
  entrypoints: ["./src/mcp-server.ts", "./src/mcp-stdio-server.ts"],
});
reportBuildResult(serverBuild, "Server modules");

// Helper function to report build results
function reportBuildResult(result: BuildOutput, label: string) {
  if (result.success) {
    const outputs = result.outputs.map((output) => output.path);
    console.log(`✅ ${label} built successfully:`, outputs);
  } else {
    console.error(`❌ ${label} build failed:`, result.logs);
  }
}

console.log("🎉 Build completed!");
