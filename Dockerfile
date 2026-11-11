# syntax=docker/dockerfile:1

# --- Stage 1: build SPA statis ---
FROM oven/bun:1.3.14 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .

# VITE_* di-inline ke bundel saat build, jadi image dibuild per lingkungan:
# image dengan VITE_SITE_URL staging TIDAK bisa dipromosikan ke production.
#
# BUILD_ID menstempel versi service worker (/sw.js?v=<id>). Isi dengan commit
# SHA: dua image dengan BUILD_ID sama membuat browser tidak pernah melihat
# service worker baru.
ARG VITE_SITE_URL=http://localhost:3000
ARG BUILD_ID
ENV VITE_SITE_URL=$VITE_SITE_URL
ENV BUILD_ID=$BUILD_ID

RUN bun run build

# --- Stage 2: nginx menyajikan dist/ dan meneruskan /api serta /media ---
FROM nginx:1.28-alpine AS runner

# Diisi envsubst dari /etc/nginx/templates saat container start. Semua harus
# terdefinisi (boleh kosong), kalau tidak `${...}` tertinggal apa adanya.
ENV API_UPSTREAM=http://sada-backend:3001
ENV MEDIA_UPSTREAM=http://sada-minio:9000
ENV BACKEND_PROXY_SECRET=
ENV MEDIA_ORIGIN=
# DNS bawaan Docker; upstream di-resolve per permintaan.
ENV NGINX_RESOLVER=127.0.0.11

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY nginx/security-headers.inc.template /etc/nginx/templates/security-headers.inc.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 3000
