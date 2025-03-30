# MCP Obsidian

A Model Context Protocol (MCP) server for interacting with Obsidian via its Local REST API.

## Prerequisites

- [Bun](https://bun.sh/) runtime
- [Obsidian](https://obsidian.md/) with the [Local REST API plugin](https://github.com/coddingtonbear/obsidian-local-rest-api) installed and configured

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/beshkenadze/mcp-obsidian.git
   cd mcp-obsidian
   ```

2. Install dependencies:
   ```bash
   make install
   # or
   bun install
   ```

3. Generate TypeScript types from the OpenAPI spec:
   ```bash
   make generate-types
   # or
   bun run generate-types
   ```

## Configuration

The MCP server is configured using environment variables:

- `PORT`: The port on which the MCP server will listen (default: 3000)
- `OBSIDIAN_BASE_URL`: The URL of the Obsidian Local REST API (default: https://127.0.0.1:27124)
- `OBSIDIAN_API_KEY`: Your Obsidian Local REST API key (required)
- `SERVER_TYPE`: The server implementation to use - either 'bun' or 'express' (default: 'bun')

You can set these variables in a `.env` file at the root of the project:

```bash
PORT=3000
OBSIDIAN_BASE_URL=https://127.0.0.1:27124
OBSIDIAN_API_KEY=your_api_key_here
SERVER_TYPE=bun  # Options: bun, express
```

## Usage

### Running the MCP Server

Start the MCP server:

```bash
make start
# or
bun run start
```

The server will be available at `http://localhost:3000` (or the port you configured).

### Server Implementation

This MCP server supports two different server implementations:

1. **Bun Server** (default): Uses Bun's native HTTP server implementation for optimal performance in Bun environments.
2. **Express Server**: Uses Express.js for compatibility with Node.js environments and broader ecosystem support.

You can switch between implementations by setting the `SERVER_TYPE` environment variable:

```bash
# For Bun server (default)
SERVER_TYPE=bun bun run start

# For Express server
SERVER_TYPE=express bun run start
```

Both implementations provide identical functionality and API endpoints. The dual implementation approach allows for:

- Testing in different environments
- Compatibility with both Bun and Node.js deployments
- Performance comparison between different server architectures

### Testing

Run the unit tests:

```bash
make test
# or
bun run test
```

Run all tests including integration tests:

```bash
make test-all
# or
bun run test:all
```

Run only integration tests (requires a running Obsidian instance with Local REST API):

```bash
make test-integration
# or
bun run test:integration
```

The test suite includes:
- Unit tests with mocks for the ObsidianClient and McpServer components
- Integration tests that test the actual communication with Obsidian

Note: The application automatically handles the self-signed certificate that Obsidian's Local REST API uses by disabling SSL certificate validation. This is secure for local development but should be used with caution if exposing the API to external networks.

### Linting

This project uses [oxlint](https://oxc.rs/docs/guide/usage/linter), a fast Rust-based JavaScript/TypeScript linter.

Run the linter to check for issues:

```bash
make lint
# or
bun run lint
```

Fix automatically fixable issues:

```bash
make lint-fix
# or
bun run lint:fix
```

### Available MCP Tools

The MCP server exposes the following tools:

- `obsidian_get_status`: Get status information from Obsidian
- `obsidian_get_active_file`: Get content of the currently active file in Obsidian
- `obsidian_update_active_file`: Update the content of the currently active file in Obsidian
- `obsidian_append_to_active_file`: Append content to the currently active file in Obsidian
- `obsidian_list_files`: List files in a directory
- `obsidian_get_file`: Get content of a file
- `obsidian_create_or_update_file`: Create a new file or update an existing one
- `obsidian_append_to_file`: Append content to a file
- `obsidian_delete_file`: Delete a file
- `obsidian_search`: Search for content in vault
- `obsidian_open_document`: Open a document in Obsidian
- `obsidian_list_commands`: List available commands in Obsidian
- `obsidian_execute_command`: Execute a command in Obsidian

## Running with SSE Support

This MCP server supports Server-Sent Events (SSE) for real-time communication with web clients. There are two ways to run the server with SSE support:

### 1. Using Built-in SSE Mode

Run the server with the SSE transport:

```bash
make start-sse
# or
bun run start:sse
```

This uses the built-in SSE implementation and listens on the configured port.

### 2. Using Supergateway (Recommended)

[Supergateway](https://github.com/supercorp-ai/supergateway) allows running stdio MCP servers over SSE or WebSockets with additional features. To use Supergateway:

```bash
make start-supergateway
# or
bun run start:supergateway
```

This starts the MCP server with Supergateway, providing:

- SSE endpoint at: `http://localhost:3001/sse`
- Message endpoint at: `http://localhost:3001/message`
- CORS support for cross-origin requests
- Improved compatibility with various MCP clients

#### Client Example

Connect to the MCP server using SSE with a web client:

```javascript
// Connect to the SSE endpoint
const eventSource = new EventSource('http://localhost:3001/sse');

// Listen for messages
eventSource.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received message:', message);
};

// Send a message to the server
async function sendMessage(message) {
  await fetch('http://localhost:3001/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}

// Example: List files in the vault
sendMessage({
  jsonrpc: '2.0',
  id: '1',
  method: 'invoke',
  params: {
    name: 'obsidian_list_files',
    parameters: {
      path: ''
    }
  }
});
```

#### Using with MCP Inspector

You can use [MCP Inspector](https://github.com/ModelContextProtocol/inspector) to test the MCP server:

```bash
# In one terminal
bun run start:supergateway

# In another terminal
npx @modelcontextprotocol/inspector http://localhost:3001
```

## Building for Production

To build a production version:

```bash
make build
# or
bun run build
```

This will create a build in the `dist` directory.

## Available Makefile Commands

For convenience, this project includes a Makefile with the following commands:

- `make install` - Install dependencies
- `make build` - Build the project
- `make lint` - Run linter
- `make lint-fix` - Run linter with autofix
- `make test` - Run unit tests
- `make test-all` - Run all tests
- `make test-integration` - Run integration tests
- `make generate-types` - Generate TypeScript types
- `make start` - Start the application
- `make precommit` - Run precommit checks
- `make clean` - Clean build artifacts
- `make act-build` - Test build GitHub Action locally
- `make act-lint` - Test lint GitHub Action locally
- `make act-test` - Test test GitHub Action locally
- `make act-release-dry` - Test release GitHub Action locally (dry run)
- `make act-release` - Test release GitHub Action locally
- `make help` - Display help information about available commands

## Using as an MCP Server

This package follows the Model Context Protocol server standard and can be used with any MCP client.

### Using with npx

The easiest way to use this server is with npx:

```bash
npx -y @beshkenadze/mcp-obsidian
```

### Configuring in Claude Desktop

To use this MCP server with Claude Desktop, add it to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": ["-y", "@beshkenadze/mcp-obsidian"],
      "env": {
        "OBSIDIAN_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Configuring in Other MCP Clients

Many MCP clients like Continue, Cursor, LibreChat, and others support MCP servers. Refer to your client's documentation for specific configuration details.

### Installation as a Package

If you want to install the package locally:

```bash
# Add to .npmrc
@beshkenadze:registry=https://npm.pkg.github.com

# Then install
npm install @beshkenadze/mcp-obsidian
# or
yarn add @beshkenadze/mcp-obsidian
# or
bun add @beshkenadze/mcp-obsidian
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.