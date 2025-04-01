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

### Installing as a Package

You can install the package directly from npm:

```bash
# Install from npm (no authentication required)
npm install @beshkenadze/mcp-obsidian
# or
yarn add @beshkenadze/mcp-obsidian
# or
bun add @beshkenadze/mcp-obsidian
```

Alternatively, you can install from GitHub Packages (requires GitHub authentication):

```bash
# Add to .npmrc
@beshkenadze:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN

# Then install
npm install @beshkenadze/mcp-obsidian
# or
yarn add @beshkenadze/mcp-obsidian
# or
bun add @beshkenadze/mcp-obsidian
```

## Development

### Release Process

This project uses [semantic-release](https://semantic-release.gitbook.io/semantic-release/) to automate version management and package publishing. The workflow:

1. Commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) format
   - `feat: add new feature` - triggers a minor release
   - `fix: resolve bug` - triggers a patch release
   - `feat!:` or `fix!:` or `refactor!:` etc. - triggers a major release
   - `chore:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:` - no release triggered

2. When commits are pushed to the main branch, the release workflow:
   - Determines the next version number based on commit messages
   - Updates package.json with the new version
   - Generates release notes from commits
   - Creates a GitHub release with the notes
   - Publishes to both npm Registry and GitHub Packages
   - Updates the repository with version changes

You can also manually trigger a release using the GitHub Actions workflow dispatch.

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

## Docker Support

You can run the MCP Obsidian server using Docker with different transport modes.

### Building the Docker Image

Build the Docker image using the provided Dockerfile:

```bash
docker build -t mcp-obsidian .
```

### Running with Docker

Run the Docker container with the appropriate environment variables:

```bash
docker run -p 3000:3000 \
  -e OBSIDIAN_API_KEY=your_api_key_here \
  -e OBSIDIAN_BASE_URL=https://host.docker.internal:27124 \
  beshkenadze/mcp-obsidian
```

Note: Use `host.docker.internal` instead of `127.0.0.1` to access Obsidian running on your host machine from within the Docker container.

#### Available Transport Modes

The Docker image supports different transport modes:

##### 1. HTTP Mode (Default)

The default mode serves the MCP server over HTTP:

```bash
docker run -p 3000:3000 \
  -e OBSIDIAN_API_KEY=your_api_key_here \
  -e OBSIDIAN_BASE_URL=https://host.docker.internal:27124 \
  beshkenadze/mcp-obsidian
```

##### 2. SSE Mode

To run with SSE transport:

```bash
docker run -p 3000:3000 \
  -e OBSIDIAN_API_KEY=your_api_key_here \
  -e OBSIDIAN_BASE_URL=https://host.docker.internal:27124 \
  -e TRANSPORT_TYPE=sse \
  beshkenadze/mcp-obsidian
```

##### 3. stdio Mode

To run with stdio transport (useful for integration with other MCP clients):

```bash
docker run -i \
  -e OBSIDIAN_API_KEY=your_api_key_here \
  -e OBSIDIAN_BASE_URL=https://host.docker.internal:27124 \
  -e TRANSPORT_TYPE=stdio \
  beshkenadze/mcp-obsidian
```

Note: When using stdio mode, you must run the container with the `-i` flag to enable interactive mode.

### Using Docker with Supergateway

To use the Docker container with Supergateway:

```bash
# Pull the public Docker image (no authentication required)
docker pull beshkenadze/mcp-obsidian

# Run the MCP server with stdio transport
docker run -i \
  -e OBSIDIAN_API_KEY=your_api_key_here \
  -e OBSIDIAN_BASE_URL=https://host.docker.internal:27124 \
  -e TRANSPORT_TYPE=stdio \
  beshkenadze/mcp-obsidian | \
npx -y @supercorp/supergateway
```

This pipes the stdio output from the Docker container to Supergateway.

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
- `obsidian_patch_active_file`: Modify the active file relative to headings, blocks, or frontmatter
- `obsidian_delete_active_file`: Delete the currently active file in Obsidian
- `obsidian_list_files`: List files in a directory
- `obsidian_get_file`: Get content of a file
- `obsidian_create_or_update_file`: Create a new file or update an existing one
- `obsidian_append_to_file`: Append content to a file
- `obsidian_patch_file`: Modify a file relative to headings, blocks, or frontmatter
- `obsidian_delete_file`: Delete a file
- `obsidian_get_periodic_note`: Get current periodic note for the specified period
- `obsidian_update_periodic_note`: Update the content of a periodic note
- `obsidian_append_to_periodic_note`: Append content to a periodic note
- `obsidian_delete_periodic_note`: Delete a periodic note
- `obsidian_patch_periodic_note`: Modify a periodic note relative to headings, blocks, or frontmatter
- `obsidian_search`: Search for content in vault with simple text queries
- `obsidian_advanced_search`: Advanced search using JsonLogic or Dataview queries
- `obsidian_open_document`: Open a document in Obsidian
- `obsidian_list_commands`: List available commands in Obsidian
- `obsidian_execute_command`: Execute a command in Obsidian

## Running with SSE Support

This MCP server supports Server-Sent Events (SSE) for real-time communication with web clients. There are multiple ways to run the server with SSE support:

### 1. Using Built-in SSE Mode

Run the server with the SSE transport:

```bash
make start-sse
# or
bun run start:sse
# or with Docker
docker run -p 3000:3000 \
  -e OBSIDIAN_API_KEY=your_api_key_here \
  -e OBSIDIAN_BASE_URL=https://host.docker.internal:27124 \
  -e TRANSPORT_TYPE=sse \
  beshkenadze/mcp-obsidian
```

This uses [Supergateway](https://github.com/supercorp-ai/supergateway) for SSE implementation and listens on the configured port.

### 2. Using Supergateway Directly

You can also run the server with the dedicated supergateway script:

```bash
# Run with supergateway
bun run start:supergateway
# or with Docker
docker run -p 3000:3000 \
  -e OBSIDIAN_API_KEY=your_api_key_here \
  -e OBSIDIAN_BASE_URL=https://host.docker.internal:27124 \
  -e TRANSPORT_TYPE=stdio \
  beshkenadze/mcp-obsidian
```

Both options provide:

- SSE endpoint at: `http://localhost:3000/sse`
- Message endpoint at: `http://localhost:3000/message`
- CORS support for cross-origin requests
- Health endpoint at: `http://localhost:3000/healthz`
- Improved compatibility with various MCP clients

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
- `make start-sse` - Start the application with SSE transport
- `make precommit` - Run precommit checks
- `make clean` - Clean build artifacts
- `make docker-build` - Build Docker image
- `make docker-run` - Run Docker container (HTTP mode)
- `make docker-run-sse` - Run Docker container with SSE transport
- `make docker-run-stdio` - Run Docker container with stdio transport
- `make docker-run-supergateway` - Run Docker container with supergateway
- `make act-build` - Test build GitHub Action locally
- `make act-lint` - Test lint GitHub Action locally
- `make act-test` - Test test GitHub Action locally
- `make act-release-dry` - Test release GitHub Action locally (dry run)
- `make act-release` - Test release GitHub Action locally
- `make help` - Display help information about available commands

## Using as an MCP Server

This package follows the Model Context Protocol server standard and can be used with any MCP client.

### Using with npx (npm Registry - No Authentication Required)

You can use this package directly from npm without authentication:

```bash
npx @beshkenadze/mcp-obsidian
```

### Using with Docker (Recommended for Anonymous Access)

The recommended way to use this MCP server without authentication is via Docker:

```bash
# Pull the public Docker image (no authentication required)
docker pull beshkenadze/mcp-obsidian

# Run with stdio transport for MCP client integration
docker run -i \
  -e OBSIDIAN_API_KEY=your_api_key_here \
  -e OBSIDIAN_BASE_URL=https://host.docker.internal:27124 \
  -e TRANSPORT_TYPE=stdio \
  beshkenadze/mcp-obsidian
```

This method requires no GitHub authentication and works out of the box with any MCP client.

### Setting Up Anonymous Access

To use this MCP server anonymously:

1. **Use npm directly**: The package is available on the npm registry without authentication requirements.
2. **Use the Docker approach**: The Docker image is publicly available without authentication requirements.
3. No GitHub tokens or authentication needed.
4. The only authentication you'll need is your Obsidian API key, which is for Obsidian access, not package access.

### Using with npx (GitHub Packages - Requires Authentication)

Since this package is also hosted on GitHub's package registry, you can use it from there with authentication:

1. Create or update your `~/.npmrc` file with your GitHub authentication:
   ```bash
   @beshkenadze:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
   ```
   
   You'll need a GitHub personal access token with the `read:packages` scope.

2. Then run:
   ```bash
   npx @beshkenadze/mcp-obsidian
   ```

### Configuring in Claude Desktop

To use this MCP server with Claude Desktop, add it to your Claude Desktop configuration:

#### Option 1: Using Docker (Recommended for Anonymous Access)

This method doesn't require GitHub authentication:

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "docker",
      "args": ["run", "-i", "beshkenadze/mcp-obsidian"],
      "env": {
        "OBSIDIAN_API_KEY": "your_api_key_here",
        "OBSIDIAN_BASE_URL": "https://host.docker.internal:27124",
        "TRANSPORT_TYPE": "stdio"
      }
    }
  }
}
```

#### Option 2: Using npx with GitHub authentication

This method requires GitHub authentication:

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": ["@beshkenadze/mcp-obsidian"],
      "env": {
        "OBSIDIAN_API_KEY": "your_api_key_here",
        "NPM_CONFIG_REGISTRY": "https://registry.npmjs.org",
        "NPM_CONFIG__AUTH_TYPES": "legacy",
        "NPM_CONFIG__AUTHTOKEN": "YOUR_GITHUB_TOKEN",
        "NPM_CONFIG__REGISTRY_SCOPES": "@beshkenadze",
        "NPM_CONFIG__REGISTRIES_@BESHKENADZE": "https://npm.pkg.github.com"
      }
    }
  }
}
```

### Configuring in Other MCP Clients

Many MCP clients like Continue, Cursor, LibreChat, and others support MCP servers. Refer to your client's documentation for specific configuration details.

### Installation as a Package

If you want to install the package locally (requires GitHub authentication):

```bash
# Add to .npmrc
@beshkenadze:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN

# Then install
npm install @beshkenadze/mcp-obsidian
# or
yarn add @beshkenadze/mcp-obsidian
# or
bun add @beshkenadze/mcp-obsidian
```

> **Note**: For anonymous access without GitHub authentication, use the Docker method described above.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.