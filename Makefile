.PHONY: install build lint test test-all test-integration start clean help act-build act-lint act-test act-release debug start-supergateway

# Default target
all: install build lint test

# Install dependencies
install:
	bun install

# Build the application
build:
	bun run build

# Run linter
lint:
	bun run lint

# Run linter with autofix
lint-fix:
	bun run lint:fix

# Run unit tests
test:
	bun run test

# Run all tests
test-all:
	bun run test:all

# Run integration tests
test-integration:
	bun run test:integration

# Generate TypeScript types
generate-types:
	bun run generate-types

# Start the application
start:
	bun start

# Run the MCP Inspector for debugging
debug:
	MCP_DEBUG=true MCP_TRANSPORT=stdio npx @modelcontextprotocol/inspector bun --inspect run src/index.ts
	
debug-sse:
	MCP_DEBUG=true MCP_TRANSPORT=sse npx @modelcontextprotocol/inspector

# Directly run SSE server without inspector
run-sse:
	MCP_TRANSPORT=sse LOG_LEVEL=trace LOG_TO_CONSOLE=true bun run src/index.ts

# Run precommit checks
precommit:
	bun run precommit

# Clean build artifacts
clean:
	rm -rf dist
	rm -rf node_modules/.cache

# Test GitHub Actions locally with act
act-build:
	act workflow_dispatch -W .github/workflows/build.yml --secret-file .env

act-lint:
	act workflow_dispatch -W .github/workflows/lint.yml --secret-file .env

act-test:
	act workflow_dispatch -W .github/workflows/test.yml --secret-file .env

# Test GitHub Actions release workflow with dry run
act-release-dry:
	act workflow_dispatch -W .github/workflows/release.yml --secret-file .env --input version=patch --input dry-run=true

# Test GitHub Actions release workflow without dry run
act-release:
	act workflow_dispatch -W .github/workflows/release.yml --secret-file .env --input version=patch --input dry-run=false

# Help command
help:
	@echo "Available targets:"
	@echo "  install          - Install dependencies"
	@echo "  build            - Build the project"
	@echo "  lint             - Run linter"
	@echo "  lint-fix         - Run linter with autofix"
	@echo "  test             - Run unit tests"
	@echo "  test-all         - Run all tests"
	@echo "  test-integration - Run integration tests"
	@echo "  generate-types   - Generate TypeScript types"
	@echo "  start            - Start the application"
	@echo "  debug            - Run MCP Inspector for debugging"
	@echo "  precommit        - Run precommit checks"
	@echo "  clean            - Clean build artifacts"
	@echo "  act-build        - Test build GitHub Action locally"
	@echo "  act-lint         - Test lint GitHub Action locally"
	@echo "  act-test         - Test test GitHub Action locally"
	@echo "  act-release-dry  - Test release GitHub Action locally (dry run)"
	@echo "  act-release      - Test release GitHub Action locally"
	@echo "  all              - Run install, build, lint, and test (default)"
	@echo "  help             - Show this help message"
	@echo "  start-supergateway - Start the application with supergateway for SSE"

start-supergateway: ## Start the application with supergateway for SSE
	bun run start:supergateway 