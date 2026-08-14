# syntax=docker/dockerfile:1

# Base image Bun (debian slim — kompatibel dengan Next.js standalone).
FROM oven/bun:1.3 AS base

# --- Stage 1: install dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# --- Stage 2: build ---
FROM base AS builder
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
# BUILD_ID yang sama, browser tidak akan pernah melihat service worker baru dan
# cache lama nyangkut di perangkat user.
ARG API_BASE_URL=http://127.0.0.1:3001/api
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG BUILD_ID
ENV API_BASE_URL=$API_BASE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV BUILD_ID=$BUILD_ID

RUN bun run build

# --- Stage 3: runner (image ramping) ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Jalankan sebagai non-root.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Output standalone Next.js (lihat next.config.ts: output: "standalone").
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["bun", "server.js"]
