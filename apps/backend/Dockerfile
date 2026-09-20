# Build context must be the monorepo ROOT (not apps/backend), so pnpm can
# resolve workspace:* deps like @muslimspaces/shared. On Railway: set this
# service's "Dockerfile Path" to apps/backend/Dockerfile while leaving the
# build context / root directory as the repo root.

FROM node:20-slim AS base
RUN corepack enable
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY apps/backend/package.json apps/backend/package.json
RUN pnpm install --frozen-lockfile --filter=backend...

FROM deps AS build
COPY . .
RUN pnpm turbo run build --filter=backend

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo /repo
WORKDIR /repo/apps/backend
EXPOSE 3001
CMD ["node", "dist/main.js"]
