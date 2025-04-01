import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get version - a simple implementation that returns a fixed version
 * instead of trying to dynamically read package.json.
 * This avoids filesystem issues when bundled.
 */
export function getVersion(): string {
  return "1.0.0";
}
