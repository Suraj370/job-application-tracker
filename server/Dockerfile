# --- Stage 1: Builder ---
# --- FIX ---
# Use 'latest' to get a Bun version new enough to read your lockfile
FROM oven/bun:latest AS builder
WORKDIR /app

# Copy package files
# Changed bun.lockb to bun.lock to match your project
COPY package.json bun.lock ./

# Install ALL dependencies (dev + prod) securely
RUN bun install --frozen-lockfile

# Copy the rest of your project code
# This copies src, prisma, index.ts, tsconfig.json, entrypoint.sh, etc.
COPY . .

# Generate the Prisma client
RUN DATABASE_URL="postgresql://dummy:dummy@dummy:5432/dummy" bunx prisma generate


# --- Stage 2: Production ---
# --- FIX ---
# Use a pinned slim version for a stable, small production image
# We can't use 'latest-slim' as it's not a valid tag.
# We'll use 1.1-slim, which is fine since we just copy files from 'builder'.
FROM oven/bun:1.1-slim AS production
WORKDIR /app

# Switch to the non-root 'bun' user for security
USER bun

# --- THIS IS THE FIX ---
# Copy *all* necessary node_modules from the 'builder' stage.
# This is fast (a local copy) and includes all prod dependencies
# AND your generated Prisma client.
COPY --chown=bun:bun --from=builder /app/node_modules ./node_modules

# Copy the other necessary files from the 'builder' stage
COPY --chown=bun:bun --from=builder /app/package.json ./package.json
# Changed bun.lockb to bun.lock to match your project
COPY --chown=bun:bun --from=builder /app/bun.lock ./bun.lock
COPY --chown=bun:bun --from=builder /app/src ./src
COPY --chown=bun:bun --from=builder /app/prisma ./prisma
COPY --chown=bun:bun --from=builder /app/index.ts ./index.ts
COPY --chown=bun:bun --from=builder /app/tsconfig.json ./tsconfig.json
COPY --chown=bun:bun --from=builder /app/entrypoint.sh .

# The 'bun' user owns entrypoint.sh, so it can make it executable
RUN chmod +x /app/entrypoint.sh

# Expose the port from your .env.prod (e.g., 5000)
EXPOSE 5000

# Run the entrypoint script
ENTRYPOINT ["/app/entrypoint.sh"]

# Set the default command for the entrypoint
CMD ["bun", "run", "index.ts"]

