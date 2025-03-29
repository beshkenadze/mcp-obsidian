import { describe, expect, test } from "bun:test";
import { CommonMcpServer } from "../src/lib/common-server";

// Create a test subclass that exposes the protected formatToolResponse method
class TestCommonMcpServer extends CommonMcpServer {
  public testFormatToolResponse(result: any) {
    return this.formatToolResponse(result);
  }

  constructor() {
    // Pass mock config
    super({
      obsidianBaseUrl: "https://mock.obsidian.url",
      obsidianApiKey: "mock_api_key",
    });
  }
}

describe("CommonMcpServer", () => {
  describe("formatToolResponse", () => {
    test("should handle string input directly", () => {
      const server = new TestCommonMcpServer();
      const result = server.testFormatToolResponse("plain string");

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "plain string",
          },
        ],
      });
    });

    test("should handle ApiResponse with string data", () => {
      const server = new TestCommonMcpServer();
      const result = server.testFormatToolResponse({ data: "# test from api" });

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "# test from api",
          },
        ],
      });
    });

    test("should not wrap string data in quotes (fixed bug)", () => {
      const server = new TestCommonMcpServer();
      const result = server.testFormatToolResponse({ data: "# test from api" });

      // Verify the result has content array with at least one item
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(0);

      // Verify the text is not wrapped in quotes
      const contentItem = result.content[0];
      expect(contentItem).toBeDefined();

      if (contentItem && contentItem.text) {
        expect(contentItem.text.startsWith('"')).toBe(false);
        expect(contentItem.text.endsWith('"')).toBe(false);
        expect(contentItem.text).toBe("# test from api");
      } else {
        // If we get here, the test will fail
        expect(false).toBe(true);
      }
    });

    test("should handle ApiResponse with null data", () => {
      const server = new TestCommonMcpServer();
      const result = server.testFormatToolResponse({ data: null });

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "",
          },
        ],
      });
    });

    test("should handle ApiResponse with object data", () => {
      const server = new TestCommonMcpServer();
      const testData = { key: "value", nested: { prop: true } };
      const result = server.testFormatToolResponse({ data: testData });

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify(testData, null, 2),
          },
        ],
      });
    });

    test("should handle ApiResponse with array data", () => {
      const server = new TestCommonMcpServer();
      const testData = [1, 2, 3, "test"];
      const result = server.testFormatToolResponse({ data: testData });

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify(testData, null, 2),
          },
        ],
      });
    });

    test("should handle ApiResponse with undefined data", () => {
      const server = new TestCommonMcpServer();
      const result = server.testFormatToolResponse({ data: undefined });

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify({ data: undefined }, null, 2),
          },
        ],
      });
    });

    test("should handle error case", () => {
      const server = new TestCommonMcpServer();
      // Create a circular reference to cause a JSON.stringify error
      const circular: any = {};
      circular.self = circular;

      const result = server.testFormatToolResponse({ data: circular });

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Error formatting response data",
          },
        ],
      });
    });
  });
});
