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
- GitHub Actions (lint, typecheck, test, audit dependency)
- Vercel untuk deploy
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
| `bun run audit`     | Audit dependency produksi      |
| `bun run format`    | Prettier format seluruh berkas |

`next build` di Next 16 **tidak lagi menjalankan lint**, jadi lint ditegakkan
lewat CI — bukan lewat build. Lihat bagian Deploy soal pembagian kerja antara
CI dan Vercel.

## Struktur

- `src/app` — routing, tipis. Metadata, manifest, ikon, halaman.
- `src/features/<domain>` — komponen, hook, service, types per domain
- `src/components` — komponen reusable lintas-fitur (`ui` shadcn, `layout`, `common`)
- `src/lib/api` — satu pintu masuk ke API backend (`client.ts`)
- `src/lib/env.ts` — validasi environment, server-only
- `src/lib/observability` — logger terstruktur & redaksi data sensitif
- `src/lib/security/csp.ts` — penyusun Content Security Policy
- `src/proxy.ts` — CSP per-request (Next 16: dulu bernama `middleware`)
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
4. **Log tidak pernah memuat data jemaat.** Semua yang masuk log melewati
   `src/lib/observability/redact.ts`. `cause` sebuah error tidak pernah dicatat
   — pada `apiClient`, kegagalan validasi Zod menyimpan nilai data yang ditolak
   di sana.

## Content Security Policy

CSP berbasis nonce, dihasilkan per-request di `src/proxy.ts` (di Next 16
konvensi `middleware` sudah diganti `proxy`). Kebijakannya disusun di
`src/lib/security/csp.ts` sebagai fungsi murni supaya bisa diuji — CSP yang
kehilangan satu direktif tidak memunculkan error, ia hanya berhenti melindungi.

Tidak ada `'unsafe-inline'` sama sekali. `'unsafe-eval'` hanya aktif di
development, karena React memakai `eval` di sana untuk merekonstruksi stack
error server di browser.

**Konsekuensi yang harus diketahui:** halaman yang memakai nonce WAJIB dirender
dinamis (`await connection()`), karena nonce dibuat per-request sementara
halaman statis dibangun saat build. Halaman statis yang menerima header CSP
ber-nonce akan tampil kosong — skrip framework di dalamnya tidak membawa nonce
sehingga diblokir browser.

**Saat menambah panggilan API dari browser** (fetch di komponen client, atau
socket.io), origin backend harus ditambahkan ke `connect-src` di
`src/lib/security/csp.ts` — termasuk skema `wss:` untuk socket. Tanpa itu
koneksinya diblokir diam-diam dan hanya terlihat di console browser production.

## Observability

Belum memakai penyedia pihak ketiga. Yang ada adalah rangka yang membuat error
bisa ditangkap, dengan satu titik sambung untuk memasang Sentry atau sejenisnya
nanti tanpa menyentuh pemanggilnya.

| Bagian        | Berkas                               | Fungsi                                                                          |
| ------------- | ------------------------------------ | ------------------------------------------------------------------------------- |
| Error server  | `src/instrumentation.ts`             | `onRequestError` mencatat setiap error render, Route Handler, dan Server Action |
| Error browser | `src/features/observability`         | Menangkap `error` dan `unhandledrejection`, mengirim ke `/api/observability`    |
| Penampung     | `src/app/api/observability/route.ts` | Memvalidasi lalu mencatat laporan dari browser                                  |
| Redaksi       | `src/lib/observability/redact.ts`    | Menyaring kredensial, query string, `cause`, dan `stack`                        |
| Keluaran      | `src/lib/observability/logger.ts`    | Satu baris JSON per peristiwa. Satu-satunya tempat `console` boleh dipakai      |

Penghubungnya adalah **`digest`**. Di production Next menyamarkan pesan error
asli dari user dan hanya menyisakan digest, yang ditampilkan di halaman error.
Digest yang sama ikut tercatat di log server — jadi laporan "muncul kode error
1a2b3c" bisa dipertemukan dengan baris lognya.

Batas yang disadari: `/api/observability` terbuka bagi siapa pun yang bisa
membuka aplikasi. Pembatas di dalamnya menahan banjir dari klien yang terjebak
loop error, bukan penyerang yang sengaja membanjiri — hitungannya per-instance
dan hilang saat restart. Pembatasan sebenarnya harus dipasang di reverse proxy
atau WAF.

## PWA

Aplikasi bisa dipasang di Chrome/Edge desktop, Chrome Android, dan Safari iOS.

- Manifest: `src/app/manifest.ts`, disajikan di `/manifest.webmanifest`
- Service worker: `public/sw.js`, didaftarkan `src/features/pwa`
- Update service worker minta persetujuan user lewat toast, tidak pernah
  `skipWaiting()` diam-diam — pertukaran aset di tengah sesi bisa mematikan
  form yang sedang diisi

Rancangan lengkap, termasuk push notification dan fase berikutnya:
`docs/superpowers/specs/2026-08-13-sada-pwa-architecture-design.md`.

## Deploy

Target deploy aplikasi ini adalah **Vercel**, dan Vercel menjalankan
`next build` sendiri pada setiap push. Karena itu `.github/workflows/ci.yml`
sengaja **tidak** punya step build — yang ditegakkan di sana hanya bagian yang
tidak dilakukan Vercel:

| Pemeriksaan      | Vercel (`next build`)                               | CI                             |
| ---------------- | --------------------------------------------------- | ------------------------------ |
| Typecheck        | ya (`typescript.ignoreBuildErrors` default `false`) | ya, umpan baliknya lebih cepat |
| Lint             | **tidak** sejak Next 16                             | ya                             |
| Test             | **tidak**                                           | ya                             |
| Audit dependency | **tidak**                                           | ya                             |

Variabel yang harus diisi di dashboard Vercel: `API_BASE_URL` dan
`NEXT_PUBLIC_SITE_URL` (yang kedua di-inline saat build, jadi ganti nilainya
berarti build ulang).

`BUILD_ID` tidak perlu diisi di Vercel — `next.config.ts` jatuh ke
`VERCEL_GIT_COMMIT_SHA` yang disediakan Vercel sendiri, sehingga versi service
worker tetap bisa ditelusuri ke commit-nya.

Dua keterbatasan yang perlu diketahui di platform serverless:

- Log dari `src/lib/observability/logger.ts` masuk ke runtime log Vercel yang
  retensinya pendek. Kalau penelusuran lewat `digest` harus bertahan lebih
  lama, log perlu diteruskan ke sink eksternal.
- Rate limit `/api/observability` disimpan di memori per-instance, dan Vercel
  menjalankan banyak instance. Angkanya jadi lebih longgar dari yang tertulis.

## Docker

Masih tersedia sebagai jalan keluar dari Vercel (`output: "standalone"`), bukan
jalur deploy utama.

```bash
NEXT_PUBLIC_SITE_URL=https://sada.example.org docker compose up --build
```

`NEXT_PUBLIC_SITE_URL` diteruskan sebagai **build arg** (nilainya di-inline saat
build). `API_BASE_URL` diteruskan sebagai environment runtime, jadi bisa diganti
tanpa build ulang image.

## Dependency

`bun run audit` adalah gerbangnya, dan CI menjalankan perintah yang sama persis
supaya hasil lokal dan hasil CI tidak pernah berbeda.

Ambangnya `--audit-level=high` dan lingkupnya `--prod`. Dependency dev (eslint,
commitlint, shadcn) tidak pernah ikut ke server maupun browser, dan
memasukkannya hanya membuat gerbang ini merah terus sampai orang berhenti
membacanya.

Lima advisory dikecualikan lewat `--ignore`. Ketiga paketnya sama-sama berujung
pada versi yang **dipin oleh Next sendiri**, jadi tidak bisa diperbaiki dari
repo ini tanpa menabrak pin upstream:

| Paket     | Advisory                                     | Kenapa dikecualikan                                                                                                                                                                                                              |
| --------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `postcss` | `GHSA-6g55-p6wh-862q`, `GHSA-r28c-9q8g-f849` | `next` mendeklarasikan `postcss` **8.4.31 persis** (tanpa caret). Kerentanannya path traversal lewat `sourceMappingURL` di komentar CSS — butuh CSS yang dikendalikan penyerang, sementara seluruh CSS repo ini ditulis sendiri. |
| `nanoid`  | `GHSA-28wg-ghj8-5hjv`, `GHSA-2v37-7h3g-55p8` | Ikut masuk lewat `postcss` yang dipin di atas, dipakai hanya untuk id source map. Perbaikannya ada di `nanoid` 3.3.16, tapi tidak bisa dijangkau selama postcss-nya beku.                                                        |
| `sharp`   | `GHSA-f88m-g3jw-g9cj`                        | `optionalDependencies` `next` dengan rentang `^0.34.5`; perbaikannya di 0.35.0, di luar rentang itu. Di repo ini `sharp` hanya memproses ikon milik sendiri — tidak ada unggahan gambar dari user.                               |

**Cabut pengecualiannya begitu Next menaikkan pin-nya.** Cara memeriksa:
jalankan `bun audit --prod` tanpa `--ignore`, lalu bandingkan dengan rentang di
`node_modules/next/package.json`.

Advisory baru di luar kelima itu tetap membuat CI merah — itu memang gunanya.
Jangan menambah `--ignore` tanpa menuliskan alasannya di tabel ini.

## Konvensi Commit

`type(scope): subject` — scope wajib, subject huruf kecil, header maksimal 100
karakter. Type yang diterima: `feat`, `fix`, `slicing`, `docs`, `chore`,
`refactor`, `test`, `ci`, `perf`, `style`, `build`, `revert`.

Contoh: `feat(pwa): tambah manifest dan service worker`.

Nama branch: huruf kecil dan angka, dipisah `-`, boleh berprefiks tipe dengan
`/` (mis. `feat/pwa-2`). Push langsung ke `main`/`development`/`production`
diblokir.
