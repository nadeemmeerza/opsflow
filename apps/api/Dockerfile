
# ============================================================
# Stage 1 — Base
# ============================================================
FROM node:22-alpine AS base

# Enable pnpm through Corepack so the container uses the
# package manager version declared by the repository.
RUN corepack enable

WORKDIR /app


# ============================================================
# Stage 2 — Dependencies
# ============================================================
FROM base AS dependencies

# Copy workspace metadata first.
#
# Keeping these files separate from application source allows
# Docker to cache dependency installation when source code changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json

# Install the complete workspace dependency graph.
RUN pnpm install --frozen-lockfile


# ============================================================
# Stage 3 — Build
# ============================================================
FROM dependencies AS build

# Copy the complete repository into the build stage.
COPY . .

# Build only the NestJS API workspace.
RUN pnpm --filter api build


# ============================================================
# Stage 4 — Production dependencies
# ============================================================
FROM dependencies AS production-dependencies

# Create a self-contained production deployment containing
# the API and its production dependencies only.
RUN pnpm deploy --legacy --filter api --prod /prod/api


# ============================================================
# Stage 5 — Production runtime
# ============================================================
FROM node:22-alpine AS production

WORKDIR /app

# Copy only production dependencies and API package metadata.
COPY --from=production-dependencies /prod/api/ ./

# Copy the compiled NestJS application.
COPY --from=build /app/apps/api/dist ./dist

# NestJS API port.
EXPOSE 3000

# Start the compiled production application.
CMD ["node", "dist/main.js"]
