# ============================================================
# Stage 1 — Base
# ============================================================

FROM node:22-alpine AS base

RUN corepack enable

WORKDIR /app


# ============================================================
# Stage 2 — Dependencies
# ============================================================

FROM base AS dependencies

# Copy only the files required to resolve the workspace
# dependencies. Keeping this separate allows Docker to
# reuse the dependency layer when application source changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json

RUN pnpm install --frozen-lockfile


# ============================================================
# Stage 3 — Build
# ============================================================

FROM dependencies AS build

COPY . .

# Build only the Next.js web application.
RUN pnpm --filter web build


# ============================================================
# Stage 4 — Production runtime
# ============================================================

FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Next.js standalone output contains the production server
# and the dependencies required to run it.
COPY --from=build /app/apps/web/.next/standalone ./

# Static assets are not automatically placed inside the
# standalone directory, so they must be copied separately.
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static

# Public assets, when present, must also be available
# to the production server.
COPY --from=build /app/apps/web/public ./apps/web/public

EXPOSE 3001

CMD ["node", "apps/web/server.js"]