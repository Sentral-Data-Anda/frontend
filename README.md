# Company Profile — GKI Graha Raya

Website company profile GKI Graha Raya. Frontend consumer (read-only) yang
menampilkan halaman statis dan menarik konten dinamis (berita, pengumuman,
jadwal ibadah, galeri) dari **API eksternal**.

## Stack

- Next.js (App Router) + React 19 + TypeScript
- Bun (package manager & runtime)
- Tailwind CSS + shadcn/ui + Framer Motion
- ESLint + Prettier + Husky + commitlint + lint-staged
- Docker (multi-stage, output standalone)

## Setup

Butuh [Bun](https://bun.sh) (lihat `.bun-version`).

```bash
bun install
cp .env.example .env   # isi API_BASE_URL
bun run dev            # http://localhost:3000
```

## Environment

| Variabel       | Wajib | Keterangan                                              |
| -------------- | ----- | ------------------------------------------------------- |
| `API_BASE_URL` | ya    | Base URL API eksternal (server-only, tanpa slash akhir) |
| `SITE_URL`     | tidak | URL publik situs untuk metadata/sitemap                 |

## Skrip

| Perintah           | Fungsi                         |
| ------------------ | ------------------------------ |
| `bun run dev`      | Mode pengembangan              |
| `bun run build`    | Build produksi (standalone)    |
| `bun run start`    | Jalankan hasil build           |
| `bun run lint`     | ESLint                         |
| `bun run lint:fix` | ESLint + perbaiki otomatis     |
| `bun run format`   | Prettier format seluruh berkas |

## Struktur

- `src/app` — routing & pages (tipis)
- `src/features/<domain>` — komponen, service, types per domain bisnis
- `src/components` — komponen reusable lintas-fitur (`ui` shadcn, `layout`, `common`, `motion`)
- `src/lib/api` — satu pintu masuk ke API eksternal (`client.ts`, `endpoints.ts`)
- `src/config` — identitas situs & navigasi

Detail arsitektur: `docs/superpowers/specs/2026-06-16-church-profile-architecture-design.md`.

## Docker

```bash
docker compose up --build
```

`API_BASE_URL` dibaca saat runtime (bukan `NEXT_PUBLIC_`), jadi bisa diganti
tanpa build ulang.

## Konvensi Commit

`type(scope): subject` — type hanya `feat` / `fix` / `slicing`, subject lowercase.
Contoh: `feat(news): tambah section berita`.
