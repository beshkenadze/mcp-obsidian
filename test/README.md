# MCP Obsidian Tests

This directory contains unit tests for the MCP Obsidian client and server.

## Test Structure

- `index.test.ts`: Main test file that imports and runs all tests
- `obsidian-client.test.ts`: Tests for the ObsidianClient class
- `mcp-server.test.ts`: Tests for the McpServer class

## Mocking Strategy

### ObsidianClient Tests

The tests for ObsidianClient rely on mocking:

1. **HTTP Requests**: We mock the `fetch` function to avoid making real API calls to Obsidian
2. **HTTPS Agent**: We mock the Node.js `https.Agent` to avoid issues with self-signed certificates

The mock setup uses Bun's mocking capabilities:

```typescript
// Create a mocked fetch implementation
const mockedFetch = mock((url: string, init?: any) => {
  return Promise.resolve(/* mocked response */);
});

// Inject the mocked fetch into the client
const client = new ObsidianClient({
  baseUrl: "https://mock.obsidian.url",
  apiKey: "mock_api_key",
  fetch: mockedFetch
});
```

### McpServer Tests

The tests for McpServer leverage:

1. **Mocked ObsidianClient**: We replace the actual ObsidianClient with a mock implementation
2. **Mocked Bun.serve**: We mock Bun's HTTP server functionality to test server start/stop methods
3. **Direct Request Handling**: We directly call the server's `handleRequest` method to test API endpoints

## Running Tests

Run the tests with:

```bash
bun test
```

Run integration tests (which talk to a real Obsidian instance) with:

```bash
bun run test:integration
```

## Adding New Tests

When adding new tests:

1. Add test cases to the appropriate test file
2. Make sure to properly mock any external dependencies
3. Reset mocks between tests to avoid test pollution
4. Verify that the tests are independent and don't rely on shared state 