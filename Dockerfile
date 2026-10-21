# syntax=docker/dockerfile:1

# --- Stage 1: install dependencies (via Bun, karena lockfile-nya bun.lock) ---
FROM oven/bun:1.3 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# --- Stage 2: build (via Node — `next build` crash/SIGILL di bawah Bun) ---
FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1

# src/lib/env.ts memvalidasi env saat modul dimuat dan TIDAK punya .default()
# (fail-fast), jadi `next build` gagal ZodError tanpa kedua variabel ini.
#
# NEXT_PUBLIC_SITE_URL wajib benar SEJAK BUILD: Next meng-inline variabel
# berprefiks NEXT_PUBLIC_ ke bundle browser, sehingga nilainya beku di dalam
# image. Image yang dibangun dengan URL staging TIDAK bisa dipromosikan ke
# production — harus build ulang dengan nilai production.
#
# API_BASE_URL di sini hanya untuk melewati validasi saat build; nilai yang
# sebenarnya dipakai container diberikan saat runtime (lihat stage runner dan
# docker-compose.yml), karena variabel non-NEXT_PUBLIC_ dibaca saat runtime.
#
# BUILD_ID menstempel versi service worker (/sw.js?v=<id>) sekaligus build id
# Next. Isi dengan commit SHA saat build image: bila dua image berbeda memakai
# BUILD_ID yang sama, browser tidak akan pernah melihat service worker baru.
ARG API_BASE_URL=http://127.0.0.1:3001/api
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG BUILD_ID
# DSN Sentry untuk browser: NEXT_PUBLIC_* di-inline ke bundle saat build, jadi
# WAJIB build arg (bukan cuma runtime env). Kosong = Sentry non-aktif.
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_SENTRY_ENVIRONMENT=staging
ENV API_BASE_URL=$API_BASE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV BUILD_ID=$BUILD_ID
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_SENTRY_ENVIRONMENT=$NEXT_PUBLIC_SENTRY_ENVIRONMENT

RUN npm run build

# --- Stage 3: runner (image ramping) ---
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Jalankan sebagai non-root.
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

# Output standalone Next.js (lihat next.config.ts: output: "standalone").
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
