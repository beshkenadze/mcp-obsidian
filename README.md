# MCP Obsidian

A Model Context Protocol (MCP) server for interacting with Obsidian via its Local REST API.

## Prerequisites

- [Bun](https://bun.sh/) runtime
- [Obsidian](https://obsidian.md/) with the [Local REST API plugin](https://github.com/coddingtonbear/obsidian-local-rest-api) installed and configured

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/mcp-obsidian.git
   cd mcp-obsidian
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Generate TypeScript types from the OpenAPI spec:
   ```bash
   bun run generate-types
   ```

## Configuration

The MCP server is configured using environment variables:

- `PORT`: The port on which the MCP server will listen (default: 3000)
- `OBSIDIAN_BASE_URL`: The URL of the Obsidian Local REST API (default: https://127.0.0.1:27124)
- `OBSIDIAN_API_KEY`: Your Obsidian Local REST API key (required)

You can set these variables in a `.env` file at the root of the project:

```bash
PORT=3000
OBSIDIAN_BASE_URL=https://127.0.0.1:27124
OBSIDIAN_API_KEY=your_api_key_here
```

## Usage

### Running the MCP Server

Start the MCP server:

```bash
bun run start
```

The server will be available at `http://localhost:3000` (or the port you configured).

### Testing

Run the unit tests:

```bash
bun run test
```

Run the integration tests (requires a running Obsidian instance with Local REST API):

```bash
bun run test:integration
```

The test suite includes:
- Unit tests with mocks for the ObsidianClient and McpServer components
- Integration tests that test the actual communication with Obsidian

Note: The application automatically handles the self-signed certificate that Obsidian's Local REST API uses by disabling SSL certificate validation. This is secure for local development but should be used with caution if exposing the API to external networks.

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

## Building for Production

To build a production version:

```bash
bun run build
```

This will create a build in the `dist` directory.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.