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
# NEXT_PUBLIC_API_BASE_URL must be present at BUILD time, not just as a
# runtime container env var: Next.js inlines process.env.NEXT_PUBLIC_* into
# the client JS bundle during `next build`, and Docker isolates the build
# from the host/service environment by default — Railway only forwards a
# service variable into the build if the Dockerfile opts in with ARG (see
# https://docs.railway.com/guides/build-time-vs-runtime-secrets). Without
# this, the client bundle silently bakes in api-client.ts's
# http://localhost:3001 fallback, so every browser-side fetch (category
# filters, the >40-result refetch) targets the visitor's own machine
# instead of the real backend. API_BASE_URL (server-only, read fresh from
# process.env on each request since the home page is force-dynamic) needs
# no such build-time wiring — only the NEXT_PUBLIC_ one does.
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
RUN pnpm turbo run build --filter=web

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo /repo
WORKDIR /repo/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]
