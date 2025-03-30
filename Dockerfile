# Use the official Bun image
# See all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Install dependencies into temp directory
# This will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lockb* /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lockb* /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Copy node_modules from temp directory
# Then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Run tests and build
ENV NODE_ENV=production
RUN bun test
RUN bun run build

# Copy production dependencies and source code into final image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/dist ./dist
COPY --from=prerelease /usr/src/app/src ./src
COPY --from=prerelease /usr/src/app/package.json .

# Set default environment variables
ENV PORT=3000
ENV SERVER_TYPE=bun
ENV TRANSPORT_TYPE=http
ENV NODE_ENV=production

# Expose the port
EXPOSE 3000/tcp

# Run the app based on TRANSPORT_TYPE
USER bun
ENTRYPOINT ["sh", "-c", "\
if [ \"$TRANSPORT_TYPE\" = \"stdio\" ]; then \
    bun run start:stdio; \
elif [ \"$TRANSPORT_TYPE\" = \"sse\" ]; then \
    bun run start:sse; \
else \
    bun run start; \
fi \
"] 