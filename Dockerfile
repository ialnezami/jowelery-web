# ── Stage: base ───────────────────────────────────────────────────────────────
FROM node:20-slim AS base

RUN apt-get update && apt-get install -y openssl

WORKDIR /app
COPY package.json package-lock.json* ./

# ── Stage: all deps ───────────────────────────────────────────────────────────
FROM base AS all-deps
RUN npm ci

# ── Stage: dev ────────────────────────────────────────────────────────────────
FROM all-deps AS dev
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ── Stage: builder ────────────────────────────────────────────────────────────
FROM all-deps AS builder

COPY . .

ARG NEXT_PUBLIC_API_URL=http://localhost:4001/api
ARG NEXTAUTH_URL=http://localhost:3000

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# IMPORTANT FOR PRISMA
RUN npx prisma generate

RUN npm run build

# ── Stage: preprod ────────────────────────────────────────────────────────────
FROM node:20-slim AS preprod

RUN apt-get update && apt-get install -y openssl

WORKDIR /app

ENV NODE_ENV=staging
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --gid 1001 nodejs \
 && useradd --uid 1001 --gid nodejs --system nextjs

COPY --from=builder /app/public ./public

RUN mkdir -p .next && chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

# ── Stage: prod ───────────────────────────────────────────────────────────────
FROM node:20-slim AS prod

RUN apt-get update && apt-get install -y openssl

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --gid 1001 nodejs \
 && useradd --uid 1001 --gid nodejs --system nextjs

COPY --from=builder /app/public ./public

RUN mkdir -p .next && chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]