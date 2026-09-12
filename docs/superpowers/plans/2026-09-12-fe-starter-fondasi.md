# fe-starter — Fondasi & Gerbang (Fase 0 + 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengangkat fondasi `fe-sada` menjadi repo starter generik `fe-starter` yang gerbang kualitasnya benar-benar menggigit, siap dipakai sebagai titik awal setiap project frontend berikutnya.

**Architecture:** Repo baru dibentuk lewat `git clone` (history dipertahankan), lalu jejak aplikasi SADA dilepas sementara komentar arsitekturnya digenerikkan dan dipertahankan. Gerbang dipindah dari lokal ke server: CI untuk lint/typecheck/test/audit, Playwright terhadap preview Vercel untuk e2e, proteksi branch di GitHub menggantikan hook lokal yang bisa ditembus.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind 4, Bun 1.3 (runtime + package manager + test runner), Zod 4, Playwright, GitHub Actions, Vercel, Docker.

**Spec:** `docs/superpowers/specs/2026-09-12-fe-starter-fondasi-design.md`

## Global Constraints

- Repo target: `fe-starter`, owner GitHub `ITFE3`, private. Lokasi lokal: `/Users/lexferndo/Documents/Project/fe-starter`.
- Bahasa komentar dan dokumentasi: Indonesia. Nama variabel, fungsi, tipe, dan pesan commit tetap mengikuti konvensi yang sudah ada di repo.
- Commit mengikuti commitlint repo ini: `type(scope): subject`, subject huruf kecil, maksimal 100 karakter header. Scope **wajib** (`scope-empty: never`). Type yang sah: `feat, fix, slicing, docs, chore, refactor, test, ci, perf, style, build, revert`.
- Sebelum menulis kode yang menyentuh API Next.js, baca dokumen terkait di `node_modules/next/dist/docs/` (aturan `AGENTS.md` repo ini). Next 16 punya breaking changes terhadap kebiasaan lama — `middleware` sudah bernama `proxy`.
- Semua komentar "kenapa" yang sudah ada dipertahankan. Yang boleh berubah hanya istilah domainnya (lihat Task 5). Menghapus komentar peringatan = kehilangan nilai utama starter ini.
- `bun run lint`, `bun run typecheck`, dan `bun run test` harus hijau di akhir setiap task. Baseline saat ini: 80 test lolos, 0 gagal.
- Test membutuhkan env: `API_BASE_URL=http://127.0.0.1:3001/api NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000` (`src/lib/env.ts` fail-fast, tanpa `.default()`).
- Jangan menambah dependency runtime baru. Satu-satunya dependency baru yang diizinkan rencana ini adalah `@playwright/test` sebagai devDependency.

---

## File Structure

**Dibuat:**

| Berkas                                    | Tanggung jawab                                       |
| ----------------------------------------- | ---------------------------------------------------- |
| `src/config/app.ts`                       | Satu-satunya sumber identitas aplikasi (nama, warna) |
| `src/app/manifest.test.ts`                | Mengunci sambungan config → manifest                 |
| `src/app/api/observability/route.test.ts` | Mengunci penolakan lintas-origin                     |
| `playwright.config.ts`                    | Konfigurasi e2e, lokal vs preview Vercel             |
| `e2e/csp.e2e.ts`                          | Test 1 — render bersih, tanpa pelanggaran CSP        |
| `e2e/pwa-assets.e2e.ts`                   | Test 2 — manifest, sw.js, header keamanan            |
| `e2e/offline.e2e.ts`                      | Test 3 — fallback offline                            |
| `.github/workflows/e2e.yml`               | Menjalankan Playwright terhadap preview Vercel       |
| `.github/workflows/docker.yml`            | Membuktikan Dockerfile masih bisa dibangun           |
| `.github/dependabot.yml`                  | Pembaruan dependency dan action                      |
| `.github/pull_request_template.md`        | Daftar periksa gerbang                               |
| `README.md`                               | Ditulis ulang total — dokumentasi arsitektur starter |

**Diubah:** `src/app/layout.tsx`, `src/app/manifest.ts`, `src/components/layout/site-footer.tsx`, `src/components/common/logo.tsx`, `src/app/robots.ts`, `src/app/api/observability/route.ts`, `src/proxy.ts`, `src/lib/security/csp.ts`, `src/lib/api/client.ts`, `src/instrumentation.ts`, `public/sw.js`, `src/config/navigation.ts`, `package.json`, `.gitignore`, `.husky/pre-push`.

**Dihapus:** `src/config/site.ts`, `src/config/brand.ts`, `src/lib/format.ts`, `src/types/api.ts`, `src/components/common/empty-state.tsx`, `docs/superpowers/specs/2026-06-16-church-profile-architecture-design.md`, `docs/superpowers/specs/2026-08-13-sada-pwa-architecture-design.md`.

---

## Task 1: Bootstrap repo dan buktikan CI hijau

Sasaran task ini bukan kode, melainkan menutup utang nomor satu: `ci.yml` di repo ini belum pernah dieksekusi sekali pun karena belum ada remote. Sampai ada satu run hijau yang bisa ditunjuk, semua gerbang berikutnya masih fiksi.

**Files:**

- Tidak ada berkas yang diubah. Task ini membentuk repo dan membuktikan CI.

**Interfaces:**

- Consumes: —
- Produces: repo `ITFE3/fe-starter` di GitHub dengan branch `main`, dan satu run workflow `CI` berstatus success.

- [ ] **Step 1: Pastikan working tree fe-sada bersih**

```bash
cd /Users/lexferndo/Documents/Project/fe-sada
git status --short
```

Harus kosong. Kalau ada perubahan belum di-commit, hentikan dan selesaikan dulu — clone hanya membawa yang sudah ter-commit.

- [ ] **Step 2: Clone menjadi repo baru**

```bash
git clone /Users/lexferndo/Documents/Project/fe-sada /Users/lexferndo/Documents/Project/fe-starter
cd /Users/lexferndo/Documents/Project/fe-starter
git remote remove origin
git checkout main
git branch -D pwa-architecture-design 2>/dev/null || true
```

`git remote remove origin` wajib: clone lokal memasang repo fe-sada sebagai `origin`, dan push tanpa menghapusnya akan mendorong perubahan starter balik ke SADA.

**Seluruh task berikutnya dikerjakan di `/Users/lexferndo/Documents/Project/fe-starter`.**

- [ ] **Step 3: Pasang dependency dan jalankan gerbang lokal**

```bash
bun install --frozen-lockfile
bun run lint
bun run typecheck
API_BASE_URL=http://127.0.0.1:3001/api NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 bun run test
bun run audit
```

Expected: lint dan typecheck tanpa output error, test `80 pass 0 fail`, audit tanpa advisory di luar daftar `--ignore`.

Kalau ada yang merah di sini, hentikan. Repo sumbernya sudah hijau; merah berarti clone atau install-nya bermasalah, bukan kodenya.

- [ ] **Step 4: Buat repo GitHub dan push**

```bash
gh repo create ITFE3/fe-starter --private --source=. --remote=origin --push
```

- [ ] **Step 5: Tunggu CI dan buktikan hijau**

```bash
gh run watch --exit-status
```

Expected: workflow `CI` selesai dengan status success, keempat step (Lint, Typecheck, Audit, Test) hijau.

Ini tonggak yang menentukan. Jangan lanjut ke task mana pun sebelum perintah ini keluar dengan exit code 0. Kalau merah, perbaiki penyebabnya di repo ini dan ulangi — jangan dilewati dengan alasan "nanti diperbaiki".

- [ ] **Step 6: Catat bukti**

```bash
gh run list --limit 1
```

Salin URL run hijau itu; ia dirujuk di README pada Task 6.

---

## Task 2: Satukan identitas aplikasi ke `src/config/app.ts`

**Files:**

- Create: `src/config/app.ts`
- Create: `src/app/manifest.test.ts`
- Delete: `src/config/site.ts`, `src/config/brand.ts`
- Modify: `src/app/layout.tsx`, `src/app/manifest.ts`, `src/components/layout/site-footer.tsx`, `src/components/common/logo.tsx`

**Interfaces:**

- Consumes: —
- Produces: `appConfig` — objek konstan `as const` dengan field `name: string`, `shortName: string`, `description: string`, `color: string`, `backgroundColor: string`, `themeColor: { light: string; dark: string }`. Diekspor bersama tipe `AppConfig = typeof appConfig`. Dipakai Task 3 (logo) dan Task 6 (README).

- [ ] **Step 1: Tulis test yang gagal**

Buat `src/app/manifest.test.ts`:

```ts
import { describe, expect, test } from "bun:test";

import manifest from "@/app/manifest";
import { appConfig } from "@/config/app";

describe("manifest", () => {
  test("mengambil identitas dari appConfig, bukan nilai yang ditulis keras", () => {
    const result = manifest();

    expect(result.name).toBe(appConfig.name);
    expect(result.short_name).toBe(appConfig.shortName);
    expect(result.description).toBe(appConfig.description);
    expect(result.background_color).toBe(appConfig.backgroundColor);
    expect(result.theme_color).toBe(appConfig.themeColor.light);
  });

  test("id dan scope tetap '/' — mengubahnya membuat instalasi lama yatim", () => {
    const result = manifest();

    expect(result.id).toBe("/");
    expect(result.scope).toBe("/");
    expect(result.start_url).toBe("/");
  });

  test("menyediakan ikon any dan maskable sebagai berkas terpisah", () => {
    const icons = manifest().icons ?? [];

    const any = icons.filter((icon) => icon.purpose === "any");
    const maskable = icons.filter((icon) => icon.purpose === "maskable");

    expect(any).toHaveLength(2);
    expect(maskable).toHaveLength(2);

    // Satu berkas dengan purpose "any maskable" membuat logo tampak
    // kekecilan di desktop. Sumbernya harus benar-benar berbeda.
    const sources = new Set(icons.map((icon) => icon.src));
    expect(sources.size).toBe(icons.length);
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

```bash
API_BASE_URL=http://127.0.0.1:3001/api NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 bun test src/app/manifest.test.ts
```

Expected: FAIL — `Cannot find module '@/config/app'`.

- [ ] **Step 3: Buat `src/config/app.ts`**

```ts
/**
 * Identitas aplikasi — SATU-SATUNYA berkas yang wajib diedit ketika starter
 * ini dipakai untuk project baru.
 *
 * Berkas ini SENGAJA tidak menyentuh `process.env` sama sekali. Ia diimpor
 * oleh komponen client (Logo → SiteHeader ber-"use client"), jadi apa pun di
 * sini otomatis ikut ke bundle browser. Variabel non-NEXT_PUBLIC_ selalu
 * `undefined` di browser, sehingga membacanya di sini berarti diam-diam selalu
 * jatuh ke fallback — dan production yang benar sekalipun tetap menampilkan
 * nilai yang salah pada apa pun yang dirender di client.
 *
 * URL situs bukan urusan berkas ini. Sumber kebenarannya `src/lib/env.ts`
 * (`publicEnv.NEXT_PUBLIC_SITE_URL`), dipakai langsung oleh berkas server yang
 * membutuhkannya.
 *
 * === KENAPA WARNA DI SINI HEX MENTAH, BUKAN VARIABEL CSS ===
 * Manifest dibaca browser di luar konteks CSS — saat memasang aplikasi,
 * sebelum satu baris CSS pun dimuat. Ia tidak bisa membaca `oklch(...)` dari
 * globals.css. Nilai di bawah adalah padanan sRGB dari token tema; bila token
 * di `src/app/globals.css` berubah, perbarui nilai di sini bersamaan.
 */
export const appConfig = {
  /** Nama lengkap. Muncul di judul halaman dan dialog instalasi PWA. */
  name: "App Starter",

  /** Nama pendek untuk home screen. Idealnya maksimal 12 karakter. */
  shortName: "Starter",

  /**
   * Wajib diisi. Tanpa `description`, dialog instalasi desktop Chrome tetap
   * generik meskipun ikon dan screenshot-nya valid.
   */
  description:
    "Starter aplikasi web terautentikasi — ganti deskripsi ini saat memakai template.",

  /**
   * Warna aksen brand. Belum otomatis menjadi `themeColor`: titlebar window
   * standalone harus menyatu dengan permukaan app shell di bawahnya, bukan
   * dengan warna logo.
   */
  color: "#3b82f6",

  /**
   * Latar splash screen Android. Harus sama dengan latar app shell — kalau
   * berbeda, terlihat berkedip saat splash berganti menjadi halaman.
   */
  backgroundColor: "#ffffff",

  /**
   * Warna titlebar desktop dan status bar Android. Varian yang mengikuti tema
   * ada di `viewport.themeColor` (src/app/layout.tsx); nilai di manifest
   * statis dan hanya menjadi fallback saat aplikasi belum berjalan.
   */
  themeColor: {
    light: "#ffffff",
    dark: "#0a0a0a",
  },
} as const;

export type AppConfig = typeof appConfig;
```

- [ ] **Step 4: Alihkan seluruh pemakai**

Di `src/app/manifest.ts`, `src/app/layout.tsx`, `src/components/layout/site-footer.tsx`, `src/components/common/logo.tsx`: ganti dua baris impor

```ts
import { brand } from "@/config/brand";
import { siteConfig } from "@/config/site";
```

menjadi satu

```ts
import { appConfig } from "@/config/app";
```

lalu ganti seluruh `siteConfig.` dan `brand.` menjadi `appConfig.`. Berkas yang hanya memakai salah satunya cukup mengganti satu impor.

Cari sisa yang terlewat:

```bash
grep -rn "config/site\|config/brand\|siteConfig\|brand\." src
```

Expected: tanpa hasil.

- [ ] **Step 5: Hapus berkas lama**

```bash
git rm src/config/site.ts src/config/brand.ts
```

- [ ] **Step 6: Jalankan seluruh gerbang**

```bash
bun run lint
bun run typecheck
API_BASE_URL=http://127.0.0.1:3001/api NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 bun run test
```

Expected: lint dan typecheck bersih, test `83 pass 0 fail` (80 lama + 3 baru).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(config): satukan identitas aplikasi ke app.ts"
```

---

## Task 3: Aset placeholder

Starter harus bisa dijalankan dan dipasang sebagai PWA sejak clone pertama, sebelum siapa pun punya logo.

**Files:**

- Modify (biner): `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/maskable-192.png`, `public/icons/maskable-512.png`, `src/app/icon.png`, `src/app/apple-icon.png`
- Modify: `src/components/common/logo.tsx`, `src/config/navigation.ts`

**Interfaces:**

- Consumes: `appConfig` dari Task 2.
- Produces: enam berkas PNG placeholder di jalur yang sama seperti sebelumnya, sehingga `manifest.ts` dan `logo.tsx` tidak perlu berubah jalurnya.

- [ ] **Step 1: Tulis skrip pembangkit ikon di scratchpad**

Skrip ini sekali pakai dan **tidak** di-commit. Simpan di scratchpad sesi, bukan di repo.

```ts
// Encoder PNG minimal: RGB solid dengan satu kotak kontras di tengah.
// Dipakai sekali untuk membangkitkan ikon placeholder, lalu dibuang.
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const table = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buf) c = table[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

type Rgb = [number, number, number];

/** `inset` 0..0.5 — seberapa jauh kotak dalam menjauh dari tepi. */
function png(size: number, bg: Rgb, fg: Rgb, inset: number): Buffer {
  const raw = Buffer.alloc(size * (size * 3 + 1));
  const lo = Math.round(size * inset);
  const hi = size - lo;

  for (let y = 0; y < size; y++) {
    const row = y * (size * 3 + 1);
    raw[row] = 0; // filter type: none
    for (let x = 0; x < size; x++) {
      const inner = x >= lo && x < hi && y >= lo && y < hi;
      const [r, g, b] = inner ? fg : bg;
      const at = row + 1 + x * 3;
      raw[at] = r;
      raw[at + 1] = g;
      raw[at + 2] = b;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const BLUE: Rgb = [0x3b, 0x82, 0xf6]; // appConfig.color
const WHITE: Rgb = [0xff, 0xff, 0xff];

const root = "/Users/lexferndo/Documents/Project/fe-starter";

// `any`: dipakai apa adanya, kotak dalam mendekati tepi.
writeFileSync(`${root}/public/icons/icon-192.png`, png(192, BLUE, WHITE, 0.24));
writeFileSync(`${root}/public/icons/icon-512.png`, png(512, BLUE, WHITE, 0.24));
writeFileSync(`${root}/src/app/icon.png`, png(192, BLUE, WHITE, 0.24));
writeFileSync(`${root}/src/app/apple-icon.png`, png(180, BLUE, WHITE, 0.24));

// `maskable`: Android memotongnya jadi lingkaran/squircle, jadi isinya
// ditarik lebih ke dalam supaya tetap berada di safe zone (lingkaran
// berdiameter 80% sisi ikon).
writeFileSync(
  `${root}/public/icons/maskable-192.png`,
  png(192, BLUE, WHITE, 0.32),
);
writeFileSync(
  `${root}/public/icons/maskable-512.png`,
  png(512, BLUE, WHITE, 0.32),
);
```

- [ ] **Step 2: Jalankan dan periksa hasilnya**

```bash
bun run /tmp/.../buat-ikon.ts   # jalur scratchpad sesi
file public/icons/*.png src/app/icon.png src/app/apple-icon.png
```

Expected: keenam berkas dilaporkan `PNG image data` dengan dimensi yang benar (192, 512, 192, 512, 192, 180).

- [ ] **Step 3: Periksa visual di browser**

```bash
API_BASE_URL=http://127.0.0.1:3001/api NEXT_PUBLIC_SITE_URL=http://localhost:3000 bun run dev
```

Buka `http://localhost:3000`. Lencana logo di header harus tampil sebagai kotak biru dengan kotak putih di tengah, bukan ikon rusak. Hentikan server setelahnya.

- [ ] **Step 4: Generikkan komentar logo dan navigasi**

`src/components/common/logo.tsx` — ganti kalimat pertama komentar:

```ts
/**
 * Lencana logo aplikasi.
 *
 * Memakai berkas ikon yang sama dengan manifest (`/icons/icon-192.png`) supaya
 * lencana di dalam aplikasi dan ikon di home screen tidak pernah berbeda —
 * satu berkas, satu tempat menggantinya.
 *
 * `sizes` diisi karena lencana ini dirender jauh lebih kecil dari sumbernya;
 * tanpa itu browser bisa mengunduh varian yang lebih besar dari perlu.
 */
```

`src/config/navigation.ts` — ganti seluruh komentar (ia menceritakan sejarah SADA yang tidak relevan di starter):

```ts
export type NavItem = {
  title: string;
  href: string;
};

/**
 * Struktur menu navigasi utama (header dan footer).
 *
 * Tiap entri di sini WAJIB menunjuk rute yang benar-benar ada. Tautan ke rute
 * yang belum dibuat akan diterbitkan ke seluruh halaman dan mengirim pengguna
 * ke 404 — dan karena header dirender di mana-mana, satu entri salah terlihat
 * di setiap layar.
 *
 * Navigasi aplikasi terautentikasi (sidebar, breadcrumb) tidak tinggal di
 * sini; ia dibangun bersama route group `(app)` pada Fase 2.
 */
export const mainNav: NavItem[] = [{ title: "Beranda", href: "/" }];
```

- [ ] **Step 5: Jalankan gerbang**

```bash
bun run lint
bun run typecheck
API_BASE_URL=http://127.0.0.1:3001/api NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 bun run test
```

Expected: semua hijau, `83 pass`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(brand): ganti ikon dan lencana dengan placeholder netral"
```

---

## Task 4: Hapus kode mati dan dependency mati

**Files:**

- Delete: `src/lib/format.ts`, `src/types/api.ts`, `src/components/common/empty-state.tsx`
- Modify: `package.json`

**Interfaces:**

- Consumes: —
- Produces: —

- [ ] **Step 1: Buktikan ketiganya benar-benar nol pemanggil**

```bash
grep -rn "lib/format\|formatDate\|types/api\|Paginated\|EmptyState" src e2e 2>/dev/null
```

Expected: satu-satunya hasil adalah baris di dalam ketiga berkas itu sendiri. Kalau ada pemanggil lain, **jangan hapus** — laporkan dan hentikan task ini.

- [ ] **Step 2: Hapus**

```bash
git rm src/lib/format.ts src/types/api.ts src/components/common/empty-state.tsx
```

`Paginated` memang akan dibutuhkan pada Fase 3. Ia ditulis ulang saat ada pemanggil nyata — tipe spekulatif yang menunggu pemakai cenderung tidak cocok dengan bentuk data yang akhirnya datang.

- [ ] **Step 3: Buktikan `@commitlint/config-conventional` tidak pernah dimuat**

```bash
grep -n "extends" commitlint.config.mjs
```

Expected: tanpa hasil. `commitlint.config.mjs` mendefinisikan seluruh `rules`-nya sendiri, jadi paket itu tidak pernah dibaca.

- [ ] **Step 4: Cabut paketnya**

```bash
bun remove @commitlint/config-conventional
```

- [ ] **Step 5: Buktikan commitlint masih menegakkan aturan**

```bash
echo "pesan salah tanpa tipe" | bunx commitlint
echo "feat(config): pesan benar" | bunx commitlint
```

Expected: perintah pertama gagal dengan pelanggaran `type-empty`/`subject-empty`; perintah kedua lolos tanpa output.

- [ ] **Step 6: Jalankan gerbang**

```bash
bun run lint
bun run typecheck
API_BASE_URL=http://127.0.0.1:3001/api NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 bun run test
bun run audit
```

Expected: semua hijau, `83 pass`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore(deps): buang kode mati dan config-conventional yang tak pernah dimuat"
```

---

## Task 5: Generikkan komentar domain

Task paling menentukan nilai starter. Istilahnya diganti; **argumennya dipertahankan utuh**. Kode tanpa komentar ini bisa diambil dari mana saja; alasan di baliknya tidak.

**Files:**

- Modify: `public/sw.js`, `src/proxy.ts`, `src/lib/security/csp.ts`, `src/lib/api/client.ts`, `src/instrumentation.ts`, `src/app/robots.ts`, `src/app/manifest.ts`, `src/lib/observability/redact.ts`, `src/features/observability/lib/report.ts`, `.env.example`, `docker-compose.yml`, `Dockerfile`
- Delete: `docs/superpowers/specs/2026-06-16-church-profile-architecture-design.md`, `docs/superpowers/specs/2026-08-13-sada-pwa-architecture-design.md`

**Interfaces:**

- Consumes: —
- Produces: working tree tanpa istilah domain SADA.

- [ ] **Step 1: Petakan tiap kemunculan**

```bash
grep -rni "sada\|gki\|jemaat\|graha\|gereja\|sekretariat\|pengurus\|ibadah\|pelayan" \
  src public docs .env.example docker-compose.yml Dockerfile README.md
```

Simpan keluarannya. Tiap baris harus dituntaskan di Step 2 atau Step 3.

- [ ] **Step 2: Terapkan padanan istilah**

Ganti manual, satu per satu — **bukan** dengan `sed` global. Beberapa kalimat perlu ditulis ulang agar tetap masuk akal setelah istilahnya diganti.

| Sebelum                      | Sesudah                                       |
| ---------------------------- | --------------------------------------------- |
| "data jemaat"                | "data terautentikasi"                         |
| "PC sekretariat"             | "perangkat bersama"                           |
| "seorang pengurus melapor"   | "seorang pengguna melapor"                    |
| "koneksi jemaat yang lambat" | "koneksi pengguna yang lambat"                |
| "SADA"                       | "aplikasi ini" / "starter ini" sesuai konteks |
| "aplikasi SADA"              | "aplikasi"                                    |
| "API SADA"                   | "API backend"                                 |
| "unggah foto jemaat"         | "unggah berkas oleh pengguna"                 |
| "jadwal pelayan"             | "daftar rujukan publik"                       |
| "id jemaat"                  | "id pengguna"                                 |
| "gkigraharaya.org"           | "api.contoh.test" / "app.contoh.test"         |

- [ ] **Step 3: Ganti rujukan ke spec SADA dengan penjelasan berdiri sendiri**

Spec yang dirujuk tidak ikut ke starter, jadi rujukannya menjadi tautan mati. Ganti dengan kalimatnya sendiri:

- `src/lib/api/client.ts`, frasa "persis kelas bug yang disebut di desain arsitektur SADA (D6/D7)" → "Data Cache Next berkunci URL dan opsi fetch, BUKAN per-user: respons pengguna A akan tersaji ke pengguna B selama jendela revalidate."
- `src/app/robots.ts`, "Lihat keputusan D2 di docs/..." → hapus kalimat rujukannya; alasan di paragraf sebelumnya sudah lengkap.
- `public/sw.js`, "Lihat docs/superpowers/specs/...-design.md §5" → "Handler `push`/`notificationclick` belum ada; keduanya butuh prasyarat backend."
- `public/sw.js`, "jangan diubah tanpa membaca §5.3 spec" → "jangan diubah tanpa membaca tiga aturan di bawah."
- `src/app/manifest.ts`, rujukan ke "fase 1b" dan spec → "belum diisi; screenshot harus tangkapan layar asli, jadi baru bisa dibuat setelah app shell ada."
- `src/config/navigation.ts` sudah dibereskan di Task 3.

- [ ] **Step 4: Hapus spec SADA**

```bash
git rm docs/superpowers/specs/2026-06-16-church-profile-architecture-design.md \
       docs/superpowers/specs/2026-08-13-sada-pwa-architecture-design.md
```

Spec fondasi starter (`2026-09-12-fe-starter-fondasi-design.md`) dan rencana ini **tetap tinggal** — keduanya menjelaskan starter, bukan SADA.

- [ ] **Step 5: Verifikasi grep bersih**

```bash
grep -rni "sada\|gki\|jemaat\|graha\|gereja\|sekretariat\|pengurus" \
  src public docs .env.example docker-compose.yml Dockerfile 2>/dev/null
```

Expected: tanpa hasil. README masih menyebut SADA pada titik ini; ia ditulis ulang total di Task 6.

Catatan: history git tetap memuat SADA. Itu disengaja — keputusan S2 di spec.

- [ ] **Step 6: Jalankan gerbang**

```bash
bun run lint
bun run typecheck
API_BASE_URL=http://127.0.0.1:3001/api NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 bun run test
```

Expected: semua hijau, `83 pass`. Task ini hanya menyentuh komentar, jadi jumlah test tidak boleh berubah.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "docs(kode): lepaskan komentar dari konteks aplikasi asal"
```

---

## Task 6: README arsitektur

Ditulis untuk orang yang baru meng-clone repo dan belum pernah melihat kodenya.

**Files:**

- Modify: `README.md` (ditulis ulang total)

**Interfaces:**

- Consumes: `appConfig` (Task 2), URL run CI hijau (Task 1 Step 6).
- Produces: —

- [ ] **Step 1: Kumpulkan fakta yang harus akurat**

```bash
cat package.json | head -60
ls -R src | head -60
cat .env.example
```

Setiap versi, jalur, dan nama skrip yang ditulis di README harus berasal dari keluaran perintah di atas, bukan dari ingatan.

- [ ] **Step 2: Tulis README**

Empat belas bagian, urut:

1. **Apa ini** — satu paragraf: starter frontend beropini untuk aplikasi terautentikasi, sudah membawa gerbang kualitas dan keamanan sejak clone pertama.
2. **Stack** — Next.js 16.2.12 (App Router), React 19.2.4, TypeScript 5, Tailwind 4, Bun 1.3 (runtime, package manager, test runner), Zod 4, base-ui + shadcn, Playwright. Tiap baris satu kalimat alasan dipilih.
3. **Mulai cepat** — `git clone`, `bun install`, `cp .env.example .env.local`, isi dua variabel wajib, `bun run dev`.
4. **Ganti identitas** — daftar periksa: `src/config/app.ts`, enam berkas ikon, `src/config/navigation.ts`, `src/app/robots.ts` bila aplikasinya publik, nama di `package.json`.
5. **Peta arsitektur** — pohon `src/` dengan peran tiap direktori, plus aturan arah impor:
   - `app/` boleh mengimpor `features/`, `components/`, `lib/`, `config/`
   - `features/` tidak boleh saling mengimpor lintas fitur kecuali lewat barrel `index.ts` masing-masing
   - `lib/` tidak boleh mengimpor `features/` maupun `app/`
   - `config/` tidak mengimpor apa pun dan tidak pernah menyentuh `process.env`
6. **Alur permintaan** — `proxy.ts` (membuat nonce CSP, menempelkannya ke header request) → Server Component → `apiClient` → backend; jalur error balik lewat `instrumentation.ts` (server) dan `instrumentation-client.ts` (browser), keduanya bermuara ke format log yang sama.
7. **Keamanan** — tiga bagian, masing-masing menunjuk berkasnya: kenapa CSP memakai nonce dan bukan `'unsafe-inline'` (`src/lib/security/csp.ts`); kenapa `apiClient` memakai `no-store` sebagai default dan menolak caching bersama kredensial (`src/lib/api/client.ts`); kenapa service worker memakai daftar putih dan tidak pernah menyimpan HTML navigasi (`public/sw.js`).
8. **Environment** — tabel: variabel, wajib/opsional, dibaca saat build atau runtime, dan konsekuensi prefiks `NEXT_PUBLIC_` (di-inline ke bundle, beku sejak build, image tidak bisa dipromosikan antar-environment).
9. **Gerbang kualitas** — apa yang dijalankan CI, apa yang dijalankan husky, apa yang dijalankan Vercel, dan kenapa step `build` sengaja tidak ada di CI. Sertakan tautan ke run hijau pertama dari Task 1.
10. **Test** — unit test (`bun test`, lingkungan DOM lewat `tests/setup.ts`) menguji fungsi murni, hook, dan komponen; e2e (`bun run e2e`) menguji CSP, aset PWA, dan siklus hidup service worker — tiga hal yang tidak bisa dibuktikan tanpa browser sungguhan.
11. **Deploy** — Vercel sebagai default; Docker sebagai alternatif self-host. Sebutkan berkas apa saja yang dihapus bila salah satu jalur tidak dipakai (`Dockerfile`, `docker-compose.yml`, `.dockerignore`, `.github/workflows/docker.yml`, dan `output: "standalone"` di `next.config.ts`).
12. **Observability** — bentuk log satu baris JSON, apa yang diredaksi dan kenapa, peran `digest` dalam menghubungkan laporan pengguna dengan baris log, dan satu paragraf: menyambungkan penyedia eksternal cukup dilakukan di dalam fungsi `emit` pada `src/lib/observability/logger.ts` — satu tempat, tanpa menyentuh satu pun pemanggilnya. Starter sengaja tidak memilih vendor.
13. **Konvensi** — pola nama branch (ditegakkan `.husky/pre-push`), format commit (ditegakkan commitlint, scope wajib), alur PR.
14. **Peta jalan** — Fase 2 (auth), Fase 3 (data layer dan contoh CRUD), Fase 4 (PWA digenerikkan), dengan rujukan ke spec di `docs/superpowers/specs/`.

- [ ] **Step 3: Verifikasi tiap perintah di README benar-benar jalan**

Jalankan setiap perintah yang ditulis di bagian "Mulai cepat" dan "Gerbang kualitas" apa adanya, dari direktori repo. Perintah yang salah ketik di README adalah hal pertama yang ditemui pembaca baru.

- [ ] **Step 4: Verifikasi grep bersih untuk seluruh repo**

```bash
grep -rni "sada\|gki\|jemaat\|graha\|gereja" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next
```

Expected: tanpa hasil. Ini gerbang §3.8 spec — dijalankan sekali di sini, bukan sebagai job CI.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "docs(readme): tulis dokumentasi arsitektur starter"
```

---

## Task 7: Vercel, proteksi branch, dan pencabutan gerbang lokal

Urutan di dalam task ini mengikat: proteksi server harus aktif **sebelum** gerbang lokal dicabut, kalau tidak ada jendela waktu tanpa penjaga apa pun.

**Files:**

- Modify: `.husky/pre-push`

**Interfaces:**

- Consumes: repo dan CI hijau dari Task 1.
- Produces: `main` terproteksi; URL preview Vercel yang dipakai Task 8.

- [ ] **Step 1: Push seluruh pekerjaan Task 2–6**

```bash
git push origin main
gh run watch --exit-status
```

Expected: CI hijau.

Catatan: `main` belum diproteksi pada titik ini, jadi push langsung masih diizinkan. Ini push langsung terakhir.

- [ ] **Step 2: Hubungkan Vercel (manual, lewat browser)**

Ini langkah manual — `vercel` CLI tidak terpasang dan integrasi GitHub memang dipasang dari dasbor.

1. Buka dasbor Vercel, "Add New Project", impor `ITFE3/fe-starter`.
2. Framework preset: Next.js (terdeteksi otomatis).
3. Environment Variables — isi untuk ketiga environment (Production, Preview, Development):
   - `API_BASE_URL` = URL backend, atau `https://api.contoh.test` bila belum ada
   - `NEXT_PUBLIC_SITE_URL` = URL production project
4. Deploy.

- [ ] **Step 3: Buktikan preview terbentuk**

```bash
git checkout -b chore/bukti-preview
echo "" >> README.md
git commit -am "chore(ci): picu preview pertama"
git push -u origin chore/bukti-preview
gh pr create --fill
```

Tunggu Vercel selesai, lalu:

```bash
gh api repos/ITFE3/fe-starter/deployments --jq '.[0] | {environment, statuses_url}'
```

Expected: ada deployment dengan environment preview. **Catat nilai persis field `environment`** — nilai itu dipakai di kondisi `if` pada Task 8, dan tebakan yang salah membuat workflow e2e tidak pernah menyala.

- [ ] **Step 4: Aktifkan proteksi branch**

```bash
gh api -X PUT repos/ITFE3/fe-starter/branches/main/protection \
  -H "Accept: application/vnd.github+json" \
  -F "required_status_checks[strict]=true" \
  -F "required_status_checks[contexts][]=Lint, typecheck, test" \
  -F "enforce_admins=true" \
  -F "required_pull_request_reviews=null" \
  -F "restrictions=null" \
  -F "allow_force_pushes=false" \
  -F "allow_deletions=false"
```

Nama context `Lint, typecheck, test` berasal dari field `name:` job di `ci.yml`. Verifikasi ejaannya:

```bash
gh api repos/ITFE3/fe-starter/commits/main/check-runs --jq '.check_runs[].name'
```

Check `e2e` belum ada pada titik ini; ia ditambahkan ke daftar required di akhir Task 8, setelah terbukti jalan. Menambahkan check yang belum pernah ada akan memblokir setiap PR selamanya.

- [ ] **Step 5: Buktikan proteksi benar-benar menggigit**

```bash
git checkout main
echo "" >> README.md
git commit -am "chore(ci): uji proteksi branch"
git push --no-verify origin main
```

Expected: **DITOLAK** server dengan pesan yang memuat `protected branch`. `--no-verify` melewati husky; kalau push ini berhasil, proteksi salah pasang — perbaiki sebelum lanjut.

Bersihkan:

```bash
git reset --hard origin/main
```

- [ ] **Step 6: Cabut blok typecheck di `.husky/pre-push`**

Hapus seluruh blok bertanda "Gerbang lokal sementara" beserta komentarnya — persis yang diperintahkan komentar itu sendiri. Yang tersisa di berkas: pemeriksaan nama branch dan larangan push ke branch terproteksi, diakhiri `echo "✅ Pushing..."`.

- [ ] **Step 7: Buktikan hook masih menolak nama branch yang salah**

```bash
git checkout -b Nama_Salah
git push -u origin Nama_Salah
```

Expected: ditolak hook dengan `❌ Invalid branch name`.

```bash
git checkout main && git branch -D Nama_Salah
```

- [ ] **Step 8: Commit lewat PR**

```bash
git checkout -b chore/cabut-gerbang-lokal
git add .husky/pre-push
git commit -m "chore(husky): cabut typecheck lokal setelah ci terbukti hijau"
git push -u origin chore/cabut-gerbang-lokal
gh pr create --fill
gh pr merge --squash --delete-branch
```

---

## Task 8: Playwright dan tiga test e2e

**Files:**

- Create: `playwright.config.ts`, `e2e/csp.e2e.ts`, `e2e/pwa-assets.e2e.ts`, `e2e/offline.e2e.ts`, `.github/workflows/e2e.yml`
- Modify: `package.json`, `.gitignore`

**Interfaces:**

- Consumes: URL preview Vercel dan nilai `environment` dari Task 7 Step 3.
- Produces: skrip `bun run e2e`; check `e2e` yang ditambahkan ke required status checks.

- [ ] **Step 1: Buat branch dan pasang Playwright**

```bash
git checkout -b feat/e2e
bun add -d @playwright/test
bunx playwright install chromium
```

- [ ] **Step 2: Tulis `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

/**
 * Dua mode, dibedakan oleh `E2E_BASE_URL`:
 *
 * - CI  — variabel diisi dengan URL preview Vercel, `webServer` mati. Vercel
 *         sudah membangun artefaknya, jadi test menembak artefak yang
 *         BENAR-BENAR akan dilihat pengguna, dan CI tidak perlu build kedua.
 * - Lokal — variabel kosong, Playwright membangun dan menjalankan servernya
 *         sendiri.
 *
 * `testMatch` memakai akhiran `.e2e.ts`, BUKAN `.spec.ts`. `bun test`
 * mengambil berkas berakhiran `.spec.ts` maupun `.test.ts`; tanpa pemisahan
 * ini, `bun run test` akan mencoba menjalankan test Playwright di runtime Bun
 * dan gagal dengan error yang menyesatkan.
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        // Service worker hanya aktif di build production, jadi test offline
        // TIDAK bisa dijalankan terhadap `next dev`.
        command: "bun run build && bun run start",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
```

- [ ] **Step 3: Tambah skrip dan abaikan artefaknya**

`package.json`, di dalam `scripts`:

```json
"e2e": "playwright test"
```

`.gitignore`, setelah blok `# testing`:

```
/test-results
/playwright-report
/blob-report
/.playwright
```

- [ ] **Step 4: Tulis Test 2 lebih dulu (paling stabil, paling cepat memberi umpan balik)**

`e2e/pwa-assets.e2e.ts`:

```ts
import { expect, test } from "@playwright/test";

/**
 * Mengunci peringatan yang ditulis berulang di src/proxy.ts dan
 * src/app/manifest.ts.
 *
 * Bila `/manifest.webmanifest` ikut dialihkan oleh proxy, browser menerima
 * HTML alih-alih JSON, menganggap manifest tidak valid, dan tombol install
 * HILANG TANPA PESAN ERROR APA PUN. Bila `/sw.js` yang dialihkan, registrasi
 * service worker gagal diam-diam. Keduanya tidak memunculkan apa pun di
 * console — inilah kelas bug yang paling sulit didiagnosis pada aplikasi
 * terautentikasi, dan Fase 2 akan memasang pengalihan auth tepat di jalur ini.
 */
test("manifest disajikan sebagai JSON yang valid", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");

  expect(response.status()).toBe(200);

  const manifest = await response.json();
  expect(manifest.name).toBeTruthy();
  expect(manifest.id).toBe("/");
  expect(manifest.start_url).toBe("/");
  expect(manifest.icons.length).toBeGreaterThanOrEqual(4);
});

test("service worker disajikan sebagai javascript tanpa cache", async ({
  request,
}) => {
  const response = await request.get("/sw.js");

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("javascript");

  // Tanpa no-store, service worker basi nyangkut di browser dan perbaikan
  // berikutnya tidak pernah sampai ke pengguna.
  expect(response.headers()["cache-control"]).toContain("no-store");
});

test("header keamanan terpasang pada dokumen", async ({ request }) => {
  const headers = (await request.get("/")).headers();

  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");

  const csp = headers["content-security-policy"];
  expect(csp).toContain("'strict-dynamic'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).not.toContain("'unsafe-inline'");
});
```

- [ ] **Step 5: Jalankan Test 2 secara lokal**

```bash
bun run e2e e2e/pwa-assets.e2e.ts
```

Expected: 3 test PASS. Build production berjalan lebih dulu (satu sampai dua menit pada jalan pertama).

- [ ] **Step 6: Tulis Test 1**

`e2e/csp.e2e.ts`:

```ts
import { expect, test } from "@playwright/test";

/**
 * Test paling berharga di repo ini.
 *
 * CSP dengan direktif yang salah tidak melempar error apa pun di sisi server.
 * Ia memblokir skrip hidrasi Next dan menyisakan layar putih di production,
 * dan satu-satunya jejaknya adalah baris di console browser. Tidak ada unit
 * test yang bisa menangkapnya.
 *
 * Bila suatu saat test ini merah karena derau dari pihak ketiga, PERSEMPIT
 * filternya — jangan hapus assertion-nya.
 */
test("halaman utama render tanpa pelanggaran csp atau error runtime", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(`${error.name}: ${error.message}`);
  });

  await page.goto("/");
  await expect(page.locator("main")).toBeVisible();

  // Hidrasi perlu benar-benar selesai sebelum console diperiksa; error
  // hidrasi muncul setelah paint pertama.
  await page.waitForLoadState("networkidle");

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("nonce berbeda pada tiap permintaan", async ({ page }) => {
  const nonceOf = async () => {
    const response = await page.goto("/");
    const csp = response?.headers()["content-security-policy"] ?? "";
    return /'nonce-([^']+)'/.exec(csp)?.[1];
  };

  const first = await nonceOf();
  const second = await nonceOf();

  expect(first).toBeTruthy();
  // Nonce yang dipakai ulang antar-permintaan sama tidak bergunanya dengan
  // 'unsafe-inline': penyerang cukup membaca satu halaman untuk memakainya.
  expect(second).not.toBe(first);
});
```

- [ ] **Step 7: Jalankan Test 1**

```bash
bun run e2e e2e/csp.e2e.ts
```

Expected: 2 test PASS.

Kalau `consoleErrors` tidak kosong, **baca isinya sebelum mengubah apa pun**. Pesan yang memuat "Refused to" atau "Content Security Policy" berarti CSP-nya memang bocor — itu bug produk, bukan bug test.

- [ ] **Step 8: Tulis Test 3**

Baca lebih dulu teks yang benar-benar dirender halaman offline:

```bash
cat src/app/offline/page.tsx
```

`e2e/offline.e2e.ts` — sesuaikan `getByRole` di bawah dengan judul asli halaman itu:

```ts
import { expect, test } from "@playwright/test";

/**
 * Satu-satunya cara membuktikan siklus hidup service worker: happy-dom di
 * `bun test` tidak punya CacheStorage sungguhan.
 *
 * Bila test ini goyah, turunkan menjadi test lokal saja dan keluarkan dari
 * CI. JANGAN menambalnya dengan `waitForTimeout` — penungguan berdurasi tetap
 * mengubah test yang goyah menjadi test yang lolos tanpa menguji apa pun.
 */
test("navigasi saat offline menyajikan halaman fallback", async ({
  page,
  context,
}) => {
  await page.goto("/");

  // Tunggu service worker benar-benar aktif DAN mengendalikan halaman.
  // `ready` saja tidak cukup: pada muatan pertama halaman belum dikendalikan,
  // sehingga handler fetch-nya tidak akan dipanggil.
  await page.waitForFunction(async () => {
    await navigator.serviceWorker.ready;
    return navigator.serviceWorker.controller !== null;
  });

  await context.setOffline(true);

  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
```

Kalau muatan pertama tidak pernah menjadi terkendali, tambahkan satu `await page.reload()` setelah `page.goto("/")` — service worker mengambil alih pada navigasi berikutnya.

- [ ] **Step 9: Jalankan seluruh e2e tiga kali berturut-turut**

```bash
bun run e2e && bun run e2e && bun run e2e
```

Expected: 6 test PASS pada ketiga jalan.

Satu kegagalan di antara tiga = test offline goyah. Keluarkan `e2e/offline.e2e.ts` dari CI (lihat Step 10) dan catat alasannya di README bagian Test. Jangan ditambal dengan penungguan.

- [ ] **Step 10: Tulis `.github/workflows/e2e.yml`**

Ganti `Preview` pada baris `if` dengan nilai persis yang dicatat di Task 7 Step 3.

```yaml
name: E2E

# Dipicu oleh laporan deployment Vercel, BUKAN oleh push.
#
# Alasannya: Vercel sudah membangun aplikasi pada tiap push. Menjalankan build
# sendiri di sini hanya menggandakan waktu tunggu, dan yang diuji jadi bukan
# artefak yang benar-benar disajikan ke pengguna. Dengan cara ini e2e tidak
# menambah satu menit pun waktu build.
on:
  deployment_status:

concurrency:
  group: e2e-${{ github.event.deployment_status.target_url }}
  cancel-in-progress: true

jobs:
  e2e:
    name: E2E
    # Filter environment WAJIB. Tanpa ini, deploy production ikut memicu
    # workflow dan test berjalan terhadap data sungguhan.
    if: >-
      github.event.deployment_status.state == 'success' &&
      github.event.deployment_status.environment == 'Preview'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version-file: .bun-version

      - name: Install dependencies
        run: bun install --frozen-lockfile

      # Unduhan browser ~120 MB. Tanpa cache, tiap run membayar satu menit
      # untuk berkas yang tidak pernah berubah.
      - name: Cache Playwright browsers
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ hashFiles('bun.lock') }}

      - name: Install Chromium
        run: bunx playwright install --with-deps chromium

      - name: Run E2E
        run: bun run e2e
        env:
          # URL preview yang baru saja dibangun Vercel.
          E2E_BASE_URL: ${{ github.event.deployment_status.target_url }}

      - name: Upload report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

- [ ] **Step 11: Jalankan gerbang lain, pastikan tidak tertabrak**

```bash
bun run lint
bun run typecheck
API_BASE_URL=http://127.0.0.1:3001/api NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 bun run test
```

Expected: `83 pass`. Kalau `bun test` mencoba menjalankan berkas di `e2e/`, akhiran `.e2e.ts` salah dipakai — perbaiki sebelum lanjut.

- [ ] **Step 12: Commit, PR, dan buktikan e2e menyala di CI**

```bash
git add -A
git commit -m "test(e2e): tambah playwright dan tiga test terhadap preview vercel"
git push -u origin feat/e2e
gh pr create --fill
gh pr checks --watch
```

Expected: check `CI` dan `E2E` keduanya hijau.

Kalau `E2E` tidak pernah muncul, nilai `environment` pada kondisi `if` salah. Periksa:

```bash
gh api repos/ITFE3/fe-starter/deployments --jq '.[0].environment'
```

- [ ] **Step 13: Merge dan jadikan e2e wajib**

```bash
gh pr merge --squash --delete-branch
gh api -X PATCH repos/ITFE3/fe-starter/branches/main/protection/required_status_checks \
  -F "strict=true" \
  -F "contexts[]=Lint, typecheck, test" \
  -F "contexts[]=E2E"
```

---

## Task 9: Workflow build Docker

**Files:**

- Create: `.github/workflows/docker.yml`

**Interfaces:**

- Consumes: `Dockerfile` yang sudah ada.
- Produces: check `Docker` pada PR yang menyentuh berkas terkait build.

- [ ] **Step 1: Buktikan Dockerfile masih bisa dibangun secara lokal**

```bash
git checkout -b ci/docker
docker build --build-arg BUILD_ID=lokal -t fe-starter:uji .
```

Expected: build sukses sampai stage `runner`.

Kalau gagal di sini, perbaiki `Dockerfile` lebih dulu — membuat workflow untuk build yang memang rusak hanya memindahkan kegagalannya ke tempat yang lebih lambat.

- [ ] **Step 2: Tulis `.github/workflows/docker.yml`**

```yaml
name: Docker

# Filter path disengaja.
#
# Repo ini punya dua jalur deploy: Vercel (default) dan Docker (self-host).
# Dockerfile yang tidak pernah dibangun akan basi diam-diam, tapi membangun
# image pada SETIAP pull request membuang dua sampai tiga menit untuk
# perubahan yang tidak menyentuh proses build. Jadi: selalu di main, dan hanya
# pada pull request yang benar-benar menyentuh berkas build.
on:
  push:
    branches:
      - main
  pull_request:
    paths:
      - Dockerfile
      - .dockerignore
      - docker-compose.yml
      - package.json
      - bun.lock
      - next.config.ts
      - .github/workflows/docker.yml

concurrency:
  group: docker-${{ github.ref }}
  cancel-in-progress: true

jobs:
  build:
    name: Build image
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Buildx
        uses: docker/setup-buildx-action@v3

      # Build saja, TIDAK di-push. Starter tidak tahu registry milik siapa;
      # project yang memakainya menambahkan langkah push sendiri.
      - name: Build
        uses: docker/build-push-action@v6
        with:
          context: .
          push: false
          build-args: |
            BUILD_ID=${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

- [ ] **Step 3: Commit, PR, dan buktikan jalan**

PR ini menyentuh `.github/workflows/docker.yml`, yang ada di daftar `paths` — jadi workflow-nya memicu dirinya sendiri pada PR pertama. Itu memang yang diinginkan.

```bash
git add .github/workflows/docker.yml
git commit -m "ci(docker): buktikan image masih bisa dibangun"
git push -u origin ci/docker
gh pr create --fill
gh pr checks --watch
```

Expected: check `Build image` hijau.

- [ ] **Step 4: Merge**

```bash
gh pr merge --squash --delete-branch
```

`Docker` **tidak** ditambahkan ke required status checks: ia tidak jalan pada sebagian besar PR karena filter path, dan required check yang tidak pernah dilaporkan akan memblokir merge selamanya.

---

## Task 10: Dependabot dan template pull request

**Files:**

- Create: `.github/dependabot.yml`, `.github/pull_request_template.md`

**Interfaces:**

- Consumes: aturan commitlint repo (`scope-empty: never`).
- Produces: —

- [ ] **Step 1: Tulis `.github/dependabot.yml`**

```yaml
version: 2

updates:
  # Ekosistem "bun" memperbarui package.json sekaligus bun.lock.
  - package-ecosystem: "bun"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 5
    # WAJIB. commitlint repo ini memakai `scope-empty: never`, jadi pesan
    # commit tanpa scope akan ditolak dan SETIAP pull request bot gagal di
    # gerbang commit-msg.
    commit-message:
      prefix: "chore"
      include: "scope"
    groups:
      # Kelompokkan yang selalu naik bersama. Next dan eslint-config-next
      # dipin ke versi yang sama; PR terpisah untuk keduanya hanya saling
      # memblokir.
      next:
        patterns:
          - "next"
          - "eslint-config-next"
      react:
        patterns:
          - "react"
          - "react-dom"
          - "@types/react"
          - "@types/react-dom"
      dev-minor:
        dependency-type: "development"
        update-types:
          - "minor"
          - "patch"

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "monthly"
    commit-message:
      prefix: "ci"
      include: "scope"
```

- [ ] **Step 2: Tulis `.github/pull_request_template.md`**

```markdown
## Apa yang berubah

<!-- Satu paragraf. Apa, dan kenapa sekarang. -->

## Daftar periksa

- [ ] `bun run lint`, `bun run typecheck`, dan `bun run test` hijau di lokal
- [ ] Test baru ditulis untuk perilaku baru, atau alasan tidak menulisnya dijelaskan di atas
- [ ] Perubahan environment variable ikut masuk `.env.example` beserta keterangan wajib/opsional
- [ ] README diperbarui bila arsitektur, gerbang, atau alur deploy berubah
- [ ] Komentar "kenapa" ditulis untuk tiap keputusan yang kegagalannya senyap (CSP, cache, service worker, auth)

## Catatan untuk reviewer

<!-- Bagian yang paling perlu dilihat, atau trade-off yang diambil sadar. -->
```

- [ ] **Step 3: Validasi sintaks kedua berkas**

```bash
bunx --yes js-yaml .github/dependabot.yml > /dev/null && echo "dependabot.yml valid"
```

Expected: `dependabot.yml valid`.

- [ ] **Step 4: Commit, PR, merge**

```bash
git checkout -b ci/dependabot
git add .github/dependabot.yml .github/pull_request_template.md
git commit -m "ci(dependabot): pasang pembaruan dependency dan template pr"
git push -u origin ci/dependabot
gh pr create --fill
gh pr checks --watch
gh pr merge --squash --delete-branch
```

- [ ] **Step 5: Buktikan Dependabot terbaca GitHub**

```bash
gh api repos/ITFE3/fe-starter/dependabot/alerts --jq 'length' 2>/dev/null || true
```

Lalu buka tab Insights → Dependency graph → Dependabot di GitHub dan pastikan kedua ekosistem terdaftar tanpa galat konfigurasi. GitHub menampilkan kesalahan parsing `dependabot.yml` **hanya** di halaman itu, tidak di Actions.

---

## Task 11: Pemeriksaan Origin pada `/api/observability`

**Files:**

- Create: `src/app/api/observability/route.test.ts`
- Modify: `src/app/api/observability/route.ts`

**Interfaces:**

- Consumes: `POST` yang sudah ada di route tersebut.
- Produces: `POST` menolak permintaan lintas-origin dengan 403.

- [ ] **Step 1: Buat branch dan tulis test yang gagal**

```bash
git checkout -b feat/origin-guard
```

`src/app/api/observability/route.test.ts`:

```ts
import { describe, expect, test } from "bun:test";

import { POST } from "@/app/api/observability/route";

const body = JSON.stringify({
  kind: "error",
  name: "TypeError",
  message: "contoh pesan",
});

function post(headers: Record<string, string>): Request {
  return new Request("http://app.contoh.test/api/observability", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body,
  });
}

describe("POST /api/observability", () => {
  test("menolak permintaan dari origin lain", async () => {
    const response = await POST(
      post({ origin: "https://penyerang.test", host: "app.contoh.test" }),
    );

    expect(response.status).toBe(403);
  });

  test("menerima permintaan se-origin", async () => {
    const response = await POST(
      post({ origin: "https://app.contoh.test", host: "app.contoh.test" }),
    );

    expect(response.status).toBe(204);
  });

  test("menerima permintaan tanpa header Origin", async () => {
    // sendBeacon dan fetch se-origin mengirim Origin, tapi tidak semua
    // browser konsisten. Ketiadaan Origin bukan bukti penyalahgunaan, jadi
    // perilaku sebelumnya dipertahankan — yang ditutup di sini adalah
    // permintaan lintas-origin yang MENYATAKAN dirinya lintas-origin.
    const response = await POST(post({ host: "app.contoh.test" }));

    expect(response.status).toBe(204);
  });

  test("menolak header Origin yang bukan URL", async () => {
    const response = await POST(
      post({ origin: "bukan-url", host: "app.contoh.test" }),
    );

    expect(response.status).toBe(403);
  });
});
```

- [ ] **Step 2: Jalankan test, pastikan gagal**

```bash
API_BASE_URL=http://127.0.0.1:3001/api NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 \
  bun test src/app/api/observability/route.test.ts
```

Expected: FAIL — dua test mengharapkan 403 tapi menerima 204.

- [ ] **Step 3: Tambahkan penjaga**

Di `src/app/api/observability/route.ts`, sisipkan sebelum `export async function POST`:

```ts
/**
 * Apakah permintaan ini berasal dari origin aplikasi sendiri?
 *
 * Dibandingkan terhadap header `Host`, BUKAN terhadap
 * `NEXT_PUBLIC_SITE_URL`. Alasannya deploy preview: nilai env itu menunjuk
 * domain production, sementara preview berjalan di host yang berbeda-beda —
 * membandingkannya ke env akan menolak setiap laporan dari preview, termasuk
 * yang datang dari test e2e.
 *
 * Ketiadaan header `Origin` tidak dianggap pelanggaran. Yang ditutup di sini
 * adalah permintaan yang MENYATAKAN dirinya datang dari origin lain —
 * penyalahgunaan lintas-origin yang sepele. Pembatas terhadap penyerang yang
 * sengaja memalsukan header tempatnya di lapisan infrastruktur, bukan di sini.
 */
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }

  const host = request.headers.get("host");
  if (!host) {
    return false;
  }

  try {
    return new URL(origin).host === host;
  } catch {
    // Origin yang bukan URL valid tidak pernah dikirim browser sungguhan.
    return false;
  }
}
```

lalu sebagai baris pertama di dalam `POST`:

```ts
if (!isSameOrigin(request)) {
  // 403 tanpa badan. Tidak ada yang perlu diberitahukan ke pemanggil
  // lintas-origin.
  return new Response(null, { status: 403 });
}
```

Pemeriksaan ini ditaruh **sebelum** rate limit: permintaan lintas-origin tidak boleh ikut menghabiskan kuota jendela dan mendorong laporan yang sah keluar.

- [ ] **Step 4: Jalankan test, pastikan lolos**

```bash
API_BASE_URL=http://127.0.0.1:3001/api NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 \
  bun test src/app/api/observability/route.test.ts
```

Expected: 4 test PASS.

- [ ] **Step 5: Jalankan seluruh gerbang**

```bash
bun run lint
bun run typecheck
API_BASE_URL=http://127.0.0.1:3001/api NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 bun run test
bun run e2e
```

Expected: `87 pass` pada unit test (83 + 4), seluruh e2e hijau.

- [ ] **Step 6: Commit, PR, merge**

```bash
git add -A
git commit -m "feat(observability): tolak laporan dari origin lain"
git push -u origin feat/origin-guard
gh pr create --fill
gh pr checks --watch
gh pr merge --squash --delete-branch
```

---

## Verifikasi akhir

Dijalankan setelah seluruh task selesai, dari clone yang benar-benar baru — bukan dari direktori kerja yang sudah hangat.

- [ ] **1. Clone bersih bisa dijalankan**

```bash
cd /tmp && rm -rf uji-starter
gh repo clone ITFE3/fe-starter uji-starter
cd uji-starter
bun install
cp .env.example .env.local
# isi API_BASE_URL dan NEXT_PUBLIC_SITE_URL
bun run dev
```

Expected: server menyala tanpa ZodError, `http://localhost:3000` merender halaman dengan logo placeholder.

- [ ] **2. Seluruh gerbang lokal hijau**

```bash
bun run lint
bun run typecheck
API_BASE_URL=http://127.0.0.1:3001/api NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000 bun run test
bun run audit
bun run e2e
```

Expected: 87 unit test lolos, seluruh e2e lolos, audit tanpa advisory di luar daftar `--ignore`.

- [ ] **3. Push langsung ke main ditolak server**

```bash
git commit --allow-empty -m "chore(ci): uji akhir proteksi"
git push --no-verify origin main
```

Expected: DITOLAK dengan pesan memuat `protected branch`.

- [ ] **4. Tidak ada sisa istilah aplikasi asal**

```bash
grep -rni "sada\|gki\|jemaat\|graha\|gereja" . \
  --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next
```

Expected: tanpa hasil.

- [ ] **5. README terbukti cukup**

Minta satu orang yang belum pernah melihat repo ini membaca README, menjalankan aplikasinya, lalu menjelaskan alur satu permintaan dari proxy sampai backend — tanpa bertanya. Bagian yang memaksa mereka bertanya adalah bagian yang harus ditulis ulang.

---

## Catatan untuk Fase berikutnya

- **Fase 2 (auth)** akan memasang pengalihan di `src/proxy.ts`. Test 2 di `e2e/pwa-assets.e2e.ts` adalah yang menahan `config.matcher` tetap mengecualikan aset PWA; ia harus tetap hijau tanpa diubah.
- **Fase 3 (data layer)** akan menulis ulang tipe `Paginated` yang dihapus di Task 4, kali ini dengan pemanggil nyata.
- **Fase 4 (PWA)** akan menuntaskan `InstallPrompt` yang saat ini diekspor tapi tidak terpasang di pohon komponen mana pun.
