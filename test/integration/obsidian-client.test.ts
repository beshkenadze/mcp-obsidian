import { expect, mock, test } from "bun:test";
import ObsidianClient from "../../src/lib/obsidian-client";

// Mock the HTTPS module before it's imported by ObsidianClient
const mockAgent = {};
mock.module("https", () => {
  return {
    Agent: class MockAgent {
      constructor() {
        return mockAgent;
      }
    },
  };
});

// Test group for ObsidianClient
test("ObsidianClient", async () => {
  // Create a client with our own fetch implementation
  /* eslint-disable-next-line no-unused-vars */
  const mockedFetch = mock((url: string, init?: any) => {
    return Promise.resolve(
      new Response(
        JSON.stringify({
          // Default mock response
          success: true,
        }),
        { status: 200 }
      )
    );
  });

  // Save original fetch
  const originalFetch = global.fetch;

  // Create client with mocked fetch
  const client = new ObsidianClient({
    baseUrl: "https://mock.obsidian.url",
    apiKey: "mock_api_key",
    fetch: mockedFetch,
  });

  try {
    // Test getStatus
    test("getStatus should return success response", async () => {
      mockedFetch.mockImplementationOnce(() => {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              authenticated: true,
              ok: "true",
              service: "obsidian",
              versions: { obsidian: "1.0.0", self: "0.1.0" },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          )
        );
      });

      const result = await client.getStatus();
      expect(result.data).toEqual({
        authenticated: true,
        ok: "true",
        service: "obsidian",
        versions: { obsidian: "1.0.0", self: "0.1.0" },
      });
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    // Test getActiveFile
    test("getActiveFile should return file content", async () => {
      const mockContent = "# Test Markdown Content";
      mockedFetch.mockImplementationOnce(() => {
        return Promise.resolve(
          new Response(mockContent, {
            status: 200,
            headers: { "Content-Type": "text/markdown" },
          })
        );
      });

      const result = await client.getActiveFile();
      expect(result.data).toEqual(mockContent);
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    // Test updateActiveFile
    test("updateActiveFile should send PUT request with content", async () => {
      mockedFetch.mockImplementationOnce(() => {
        return Promise.resolve(new Response(null, { status: 204 }));
      });

      mockedFetch.mockClear(); // Clear previous calls
      const content = "# Updated Content";
      const result = await client.updateActiveFile(content);

      expect(result.error).toBeUndefined();
      expect(mockedFetch).toHaveBeenCalledTimes(1);

      const callArgs = mockedFetch.mock.calls[0];
      expect(callArgs).toBeDefined();
      // Use type assertion since we've verified callArgs exists
      const args = callArgs as any[];
      expect(args.length).toBeGreaterThan(1);
      expect(args[1].method).toBe("PUT");
      expect(args[1].body).toBe(content);
    });

    // Test listDirectory
    test("listDirectory should return file list", async () => {
      const mockFiles = ["file1.md", "file2.md"];
      mockedFetch.mockImplementationOnce(() => {
        return Promise.resolve(
          new Response(JSON.stringify({ files: mockFiles }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      });

      mockedFetch.mockClear(); // Clear previous calls
      const result = await client.listDirectory();
      expect(result.data?.files).toEqual(mockFiles);
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    // Test getFile
    test("getFile should return file content", async () => {
      const mockContent = "# Test File Content";
      mockedFetch.mockImplementationOnce(() => {
        return Promise.resolve(
          new Response(mockContent, {
            status: 200,
            headers: { "Content-Type": "text/markdown" },
          })
        );
      });

      mockedFetch.mockClear(); // Clear previous calls
      const result = await client.getFile("test.md");
      expect(result.data).toEqual(mockContent);
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });

    // Test error handling
    test("should handle error responses", async () => {
      mockedFetch.mockImplementationOnce(() => {
        return Promise.resolve(
          new Response(JSON.stringify({ error: "Not found" }), {
            status: 404,
            statusText: "Not Found",
            headers: { "Content-Type": "application/json" },
          })
        );
      });

      mockedFetch.mockClear(); // Clear previous calls
      const result = await client.getFile("nonexistent.md");
      expect(result.error).toBeDefined();
      expect(result.error?.status).toBe(404);
      expect(mockedFetch).toHaveBeenCalledTimes(1);
    });
  } finally {
    // Restore original fetch
    global.fetch = originalFetch;
    mock.restore();
  }
});
