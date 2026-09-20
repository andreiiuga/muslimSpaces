# Build context must be the monorepo ROOT (not apps/web), so pnpm can
# resolve workspace:* deps like @muslimspaces/shared. On Railway: set this
# service's "Dockerfile Path" to apps/web/Dockerfile while leaving the
# build context / root directory as the repo root.

FROM node:20-slim AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile --filter=web...

FROM deps AS build
COPY . .
# API_BASE_URL must point at the backend's PUBLIC Railway URL at build time —
# the home page is server-rendered (force-dynamic), not statically prerendered,
# but Next still needs this at runtime; set it as a Railway service variable.
RUN pnpm turbo run build --filter=web

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo /repo
WORKDIR /repo/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]
