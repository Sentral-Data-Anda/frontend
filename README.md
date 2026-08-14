# SADA — Sentral Data Anda

Aplikasi pengelolaan data dan pelayanan jemaat GKI Graha Raya. Satu aplikasi
terautentikasi untuk semua peran: jemaat dan pengurus/sekretariat masuk lewat
aplikasi yang sama dengan menu berbeda per peran.

Dipakai di **mobile dan desktop** sebagai dua form-factor kelas satu — jemaat
dominan memakai HP, pengurus mengerjakan layar CRUD di PC. Aplikasi ini juga
sebuah PWA: bisa dipasang ke home screen/desktop dan (nanti) menerima push
notification.

> **Status: kerangka arsitektur.** Repo ini sedang ditata dan belum berisi
> fitur. Situs profil gereja adalah project terpisah, bukan repo ini.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- Bun (package manager & runtime) — lihat `.bun-version`
- Tailwind CSS 4 + shadcn/ui
- Zod untuk validasi env dan bentuk respons API
- ESLint + Prettier + Husky + commitlint + lint-staged
- GitHub Actions (lint, typecheck, test, build)
- Docker (multi-stage, `output: "standalone"`)

## Setup

```bash
bun install
cp .env.example .env   # isi kedua variabel
bun run dev            # http://localhost:3000
```

Untuk menguji service worker atau push notification secara lokal, jalankan
lewat HTTPS — Push API menolak origin non-HTTPS:

```bash
bun run dev --experimental-https
```

## Environment

Keduanya **wajib**. `src/lib/env.ts` memvalidasi saat modul dimuat dan tidak
punya nilai default, jadi proses gagal start bila salah satu belum di-set —
disengaja, supaya production tidak menyala diam-diam dengan konfigurasi salah.

| Variabel               | Dibaca kapan | Keterangan                                                                   |
| ---------------------- | ------------ | ---------------------------------------------------------------------------- |
| `API_BASE_URL`         | runtime      | Base URL API backend, tanpa slash akhir. Server-only, tidak pernah ke client |
| `NEXT_PUBLIC_SITE_URL` | **build**    | URL publik aplikasi. Di-inline ke bundle saat `next build`                   |

`NEXT_PUBLIC_SITE_URL` beku sejak build: image Docker yang dibangun dengan URL
staging **tidak bisa** dipromosikan ke production tanpa build ulang.

## Skrip

| Perintah            | Fungsi                         |
| ------------------- | ------------------------------ |
| `bun run dev`       | Mode pengembangan              |
| `bun run build`     | Build produksi (standalone)    |
| `bun run start`     | Jalankan hasil build           |
| `bun run lint`      | ESLint                         |
| `bun run lint:fix`  | ESLint + perbaiki otomatis     |
| `bun run typecheck` | `tsc --noEmit`                 |
| `bun run test`      | `bun test`                     |
| `bun run format`    | Prettier format seluruh berkas |

`next build` di Next 16 **tidak lagi menjalankan lint**, jadi lint dan
typecheck ditegakkan lewat CI — bukan lewat build.

## Struktur

- `src/app` — routing, tipis. Metadata, manifest, ikon, halaman.
- `src/features/<domain>` — komponen, hook, service, types per domain
- `src/components` — komponen reusable lintas-fitur (`ui` shadcn, `layout`, `common`)
- `src/lib/api` — satu pintu masuk ke API backend (`client.ts`)
- `src/lib/env.ts` — validasi environment, server-only
- `src/config` — identitas aplikasi & navigasi
- `public/sw.js` — service worker, ditulis tangan

## Aturan yang tidak boleh dilanggar

Ketiganya soal keamanan data jemaat, bukan preferensi gaya:

1. **Data terautentikasi tidak pernah di-cache.** Default `apiClient` adalah
   `cache: "no-store"`, dan kombinasi caching eksplisit dengan header
   `Authorization`/`Cookie` ditolak di kode. Data Cache Next berkunci URL,
   bukan user — respons user A akan tersaji ke user B.
2. **Konfigurasi server tidak pernah masuk bundle client.** `src/lib/env.ts`
   dijaga `import "server-only"`; komponen client membaca `NEXT_PUBLIC_*`
   langsung, bukan dengan mengimpor modul env.
3. **Service worker tidak menyimpan HTML halaman ber-auth maupun respons API.**
   Handler `fetch`-nya memakai daftar putih, bukan tangkap-semua.

## PWA

Aplikasi bisa dipasang di Chrome/Edge desktop, Chrome Android, dan Safari iOS.

- Manifest: `src/app/manifest.ts`, disajikan di `/manifest.webmanifest`
- Service worker: `public/sw.js`, didaftarkan `src/features/pwa`
- Update service worker minta persetujuan user lewat toast, tidak pernah
  `skipWaiting()` diam-diam — pertukaran aset di tengah sesi bisa mematikan
  form yang sedang diisi

Rancangan lengkap, termasuk push notification dan fase berikutnya:
`docs/superpowers/specs/2026-08-13-sada-pwa-architecture-design.md`.

## Docker

```bash
NEXT_PUBLIC_SITE_URL=https://sada.example.org docker compose up --build
```

`NEXT_PUBLIC_SITE_URL` diteruskan sebagai **build arg** (nilainya di-inline saat
build). `API_BASE_URL` diteruskan sebagai environment runtime, jadi bisa diganti
tanpa build ulang image.

## Konvensi Commit

`type(scope): subject` — scope wajib, subject huruf kecil, header maksimal 100
karakter. Type yang diterima: `feat`, `fix`, `slicing`, `docs`, `chore`,
`refactor`, `test`, `ci`, `perf`, `style`, `build`, `revert`.

Contoh: `feat(pwa): tambah manifest dan service worker`.

Nama branch: huruf kecil dan angka, dipisah `-`, boleh berprefiks tipe dengan
`/` (mis. `feat/pwa-2`). Push langsung ke `main`/`development`/`production`
diblokir.
