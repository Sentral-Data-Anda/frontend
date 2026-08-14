# Desain Arsitektur — Company Profile GKI Graha Raya

> ## ⚠️ DOKUMEN INI SUDAH TIDAK BERLAKU UNTUK REPO INI
>
> **Digantikan oleh:** `2026-08-13-sada-pwa-architecture-design.md`
>
> Repo ini berubah peran: dari website company profile menjadi aplikasi
> **SADA (Sentral Data Anda)** — aplikasi terautentikasi berisi data jemaat.
> Situs profil gereja menjadi project terpisah.
>
> Yang di bawah ini **tidak lagi menggambarkan repo ini**:
>
> - Seluruh `src/features/` (news, gallery, schedule, announcement, about) dan
>   `src/app/(public)/` sudah dihapus. Kodenya tersimpan di commit
>   `6b7bde2` untuk dipindahkan ke project situs profil.
> - Pola SSR/ISR `revalidate` **dilarang** untuk data terautentikasi. Default
>   `apiClient` sekarang `cache: "no-store"`, dan menggabungkan caching
>   eksplisit dengan header `Authorization`/`Cookie` ditolak di kode.
> - `robots.ts` dan `sitemap.ts` yang dioptimalkan untuk indexing sudah
>   dibalik/dihapus — aplikasi ber-auth tidak boleh terindeks.
>
> Dokumen ini dipertahankan sebagai catatan sejarah dan sebagai titik awal
> ketika project situs profil dibuat nanti. **Jangan dijadikan rujukan untuk
> pekerjaan di repo ini.**

**Tanggal:** 2026-06-16
**Status:** Digantikan (lihat kotak di atas)
**Lokasi project:** `project/gki-graharaya/company-profile`

## 1. Ringkasan & Tujuan

Website company profile untuk GKI Graha Raya. Project ini adalah **frontend consumer murni**:
menampilkan halaman profil statis dan menarik konten dinamis (berita, pengumuman, galeri,
jadwal ibadah) dari **API eksternal** yang dikelola aplikasi terpisah.

**Project ini TIDAK punya:** database sendiri, CMS, sistem auth, atau admin panel.
Semua data dinamis diperoleh **read-only** lewat API eksternal.

## 2. Stack Teknologi

| Bagian                    | Pilihan                                                       |
| ------------------------- | ------------------------------------------------------------- |
| Framework                 | Next.js (App Router) + React 19                               |
| Bahasa                    | TypeScript                                                    |
| Package manager / runtime | **Bun**                                                       |
| Styling                   | Tailwind CSS                                                  |
| Komponen UI               | shadcn/ui                                                     |
| Animasi                   | Framer Motion                                                 |
| Rendering                 | SSR + ISR (fetch di Server Component, cache via `revalidate`) |
| Deployment                | Docker (multi-stage, `output: 'standalone'`)                  |
| Tipe situs                | Multi-page                                                    |

## 3. Keputusan Arsitektur

- **Feature/Domain-based structure** — folder diorganisir per domain bisnis (`features/news`,
  `features/schedule`, dst), bukan per tipe file. Alasannya: mudah di-skala, boundary jelas,
  cocok untuk project yang konsumsi banyak endpoint API berbeda.
- **`app/` tipis** — hanya untuk routing. Tiap `page.tsx` cukup memanggil section dari `features/`.
- **Satu pintu masuk per feature** — tiap feature mengekspor satu komponen container utama
  (mis. `NewsSection`) lewat `index.ts` (barrel export), itu yang dipanggil di `app/`.
- **Satu API client** — semua panggilan ke API eksternal lewat `lib/api/client.ts`
  (handle base URL, header, timeout, error, opsi revalidate). Service per-feature memakai client ini.
- **SSR/ISR** — konten dinamis di-cache dengan `revalidate` agar SEO maksimal & hemat hit API.

## 4. Struktur Folder

```
company-profile/
├── src/
│   ├── app/                          # App Router — routing & pages saja
│   │   ├── (public)/
│   │   │   ├── page.tsx              # Beranda
│   │   │   ├── tentang/page.tsx      # Profil & sejarah
│   │   │   ├── jadwal/page.tsx       # Jadwal ibadah (ISR dari API)
│   │   │   ├── berita/
│   │   │   │   ├── page.tsx          # List berita/pengumuman
│   │   │   │   └── [slug]/page.tsx   # Detail berita
│   │   │   ├── galeri/page.tsx       # Galeri
│   │   │   └── kontak/page.tsx       # Kontak & lokasi
│   │   ├── layout.tsx                # Root layout (font, providers, header/footer)
│   │   ├── error.tsx                 # Error boundary global
│   │   ├── not-found.tsx             # 404 custom
│   │   ├── loading.tsx               # Loading global
│   │   ├── sitemap.ts                # SEO
│   │   └── robots.ts                 # SEO
│   │
│   ├── features/                     # Inti — per domain bisnis
│   │   ├── news/
│   │   │   ├── components/           # news-card, news-list, news-section
│   │   │   ├── services/             # news.service.ts (panggil API)
│   │   │   ├── types/                # news.types.ts
│   │   │   ├── hooks/                # opsional (kalau ada bagian client)
│   │   │   └── index.ts              # barrel export pintu masuk feature
│   │   ├── schedule/                 # Jadwal ibadah
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   ├── gallery/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   ├── announcement/             # Pengumuman
│   │   │   └── ...
│   │   └── about/                    # Profil & sejarah (statis)
│   │       └── ...
│   │
│   ├── components/                   # Komponen reusable lintas-fitur
│   │   ├── ui/                       # shadcn/ui (auto-generate ke sini)
│   │   ├── layout/                   # Header, Footer, Navbar, Container
│   │   ├── common/                   # Logo, SectionTitle, EmptyState
│   │   └── motion/                   # Wrapper Framer Motion (FadeIn, Reveal)
│   │
│   ├── lib/                          # Util & infra non-domain
│   │   ├── api/
│   │   │   ├── client.ts             # Fetch wrapper (base URL, header, error)
│   │   │   └── endpoints.ts          # Konstanta endpoint API eksternal
│   │   ├── utils.ts                  # cn() shadcn + helper umum
│   │   ├── seo.ts                    # Helper metadata
│   │   └── env.ts                    # Validasi env var (zod)
│   │
│   ├── config/                       # Konfigurasi statis app
│   │   ├── site.ts                   # Nama gereja, deskripsi, sosmed
│   │   └── navigation.ts             # Struktur menu navigasi
│   │
│   ├── types/                        # Type global (shared)
│   │   └── api.ts                    # Tipe response API umum (pagination, dll)
│   │
│   ├── styles/
│   │   └── globals.css               # Tailwind + CSS variable tema
│   │
│   └── hooks/                        # Hook global reusable (useMediaQuery, dll)
│
├── public/                           # Aset statis (gambar, favicon, og-image)
├── .env.example                      # Template env (NEXT_PUBLIC_API_URL, dll)
├── .dockerignore
├── Dockerfile                        # Multi-stage berbasis image Bun
├── docker-compose.yml                # Untuk dev/deploy lokal
├── components.json                   # Config shadcn/ui
├── tailwind.config.ts
├── next.config.ts                    # output: 'standalone'
├── tsconfig.json                     # path alias @/*
├── bunfig.toml                       # Config Bun (opsional)
├── bun.lock                          # Lockfile Bun
└── package.json
```

## 5. Pola Per-Feature (contoh `news`)

Alur: komponen kecil → dirakit container → di-export via `index.ts` → dipanggil di `app/`.

- `news-card.tsx` — menampilkan 1 berita (komponen terkecil, reusable).
- `news-list.tsx` — merakit banyak `NewsCard` jadi grid.
- `news-section.tsx` — **pintu masuk feature**, Server Component async yang fetch data
  (lewat `news.service.ts`) lalu menyusun section utuh.
- `index.ts` — `export { NewsSection } from "./components/news-section"`.

Di routing: `app/(public)/berita/page.tsx` cukup `import { NewsSection } from "@/features/news"`
lalu render, dengan `export const revalidate = 300` untuk ISR.

**Aturan penempatan komponen:** dipakai 1 domain → taruh di `features/<domain>`;
dipakai lintas domain → naikkan ke `components/`.

## 6. Layer API

- `lib/api/client.ts` — satu fetch wrapper untuk semua panggilan API eksternal:
  base URL dari env, header default, timeout, normalisasi error, dukungan opsi `next.revalidate`.
- `lib/api/endpoints.ts` — konstanta path endpoint (mis. `/news`, `/schedules`, `/galleries`).
- `features/<domain>/services/*.service.ts` — fungsi spesifik domain (mis. `getNewsList`,
  `getNewsBySlug`) yang memanggil `client` + memetakan ke tipe domain.
- `lib/env.ts` — validasi env var dengan zod saat startup (mis. `NEXT_PUBLIC_API_URL` wajib ada).

## 7. Error Handling & SEO

- `loading.tsx` + `error.tsx` per segment → UX mulus saat API lambat/gagal.
- `not-found.tsx` untuk slug berita yang tidak ada.
- ISR via `revalidate` → konten fresh berkala tanpa membebani API.
- `sitemap.ts` + `robots.ts` + metadata dinamis per halaman → SEO maksimal.

## 8. Bun & Docker

- **Bun** sebagai package manager & runtime: `bun install`, `bun run dev`, `bun run build`.
  Script di `package.json` dijalankan via Bun. Lockfile: `bun.lock`.
- **Dockerfile** multi-stage berbasis image resmi `oven/bun`:
  1. `deps` — `bun install --frozen-lockfile`
  2. `builder` — `bun run build` (menghasilkan output `standalone`)
  3. `runner` — image ramping menjalankan server Next.js standalone (non-root user).
- `docker-compose.yml` untuk menjalankan secara lokal, dengan `NEXT_PUBLIC_API_URL`
  diinject lewat environment.

## 9. Standar Tooling & Code Quality

Diadaptasi dari project AAA-POWER-WMS, dengan penyesuaian: **semua perintah `npm`/`npx`
diganti `bun`/`bunx`**, dan plugin khusus Mantine dihapus (project ini pakai Tailwind/shadcn).

### 9.1 ESLint — `eslint.config.mjs` (flat config)

Basis: `next/core-web-vitals` + `next/typescript` + `import/order` + Prettier compat.

```js
import { dirname } from "path";
import { fileURLToPath } from "url";

import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  { ignores: ["node_modules", ".next", "out", "dist", "build", "coverage"] },

  ...compat.extends("next/core-web-vitals", "next/typescript"),

  {
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "prefer-const": "error",
      "no-console": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "import/order": [
        "error",
        {
          alphabetize: { order: "asc", caseInsensitive: true },
          "newlines-between": "always",
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
```

> **Catatan koreksi (bug di WMS):** config WMS punya **kunci duplikat** di akhir
> (`@typescript-eslint/no-explicit-any` dan `react-hooks/exhaustive-deps` dideklarasi dua kali).
> Karena objek JS, deklarasi terakhir menang — jadi `no-explicit-any` & `exhaustive-deps`
> **diam-diam mati** padahal di atasnya diset aktif. Untuk standar baru saya hapus duplikatnya
> dan set keduanya ke `"warn"` (kompromi: tidak memblok build, tapi tetap kelihatan).
> Kalau Anda mau perilaku WMS apa adanya (kedua rule mati), tinggal ubah ke `"off"`.

### 9.2 Prettier — `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 80,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

`.prettierignore` & `.eslintignore`: `node_modules`, `.next`, `out`, `dist`, `build`, `coverage`.

### 9.3 Commitlint — `commitlint.config.js`

```js
const commitlintConfig = {
  rules: {
    "header-max-length": [2, "always", 100],
    "type-enum": [2, "always", ["feat", "fix", "slicing"]],
    "type-case": [2, "always", "lower-case"],
    "scope-empty": [2, "never"],
    "subject-empty": [2, "never"],
    "subject-case": [2, "always", "lower-case"],
  },
};

export default commitlintConfig;
```

Format commit wajib: `type(scope): subject` — type hanya `feat`/`fix`/`slicing`, scope wajib ada,
subject lowercase. Contoh: `feat(news): tambah section berita`.

### 9.4 Husky hooks (versi Bun)

`.husky/commit-msg`:

```sh
#!/bin/sh
bunx --no-install commitlint --edit "$1"
```

`.husky/pre-commit`:

```sh
#!/bin/sh
echo "🔍 Running lint-staged..."
bunx lint-staged

echo "🔍 Running ESLint..."
bun run lint

echo "🔍 Running Prettier..."
bun run format

echo "🏗 Running build check..."
bun run build
```

`.husky/pre-push` — blokir push langsung ke `development`/`production`, enforce penamaan
branch lowercase-dengan-dash, dan cek branch tidak tertinggal dari `development` (sama persis
seperti WMS, tidak ada perintah package manager di dalamnya jadi tak perlu diubah).

> **Catatan performa:** `pre-commit` WMS menjalankan **full `build`** tiap commit — paling aman
> tapi lambat di project besar. Saya pertahankan agar konsisten dengan standar Anda; kalau nanti
> terasa berat, build cukup dipindah ke `pre-push` saja.

### 9.5 `package.json` — scripts, lint-staged, devDependencies

```jsonc
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "lint:fix": "eslint . --ext .js,.jsx,.ts,.tsx --fix",
    "format": "prettier --write .",
    "prepare": "husky",
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
  },
}
```

devDependencies tooling: `@commitlint/cli`, `@commitlint/config-conventional`,
`@eslint/eslintrc`, `eslint`, `eslint-config-next`, `eslint-config-prettier`,
`eslint-plugin-import`, `husky`, `lint-staged`, `prettier`, `typescript`, plus tipe
`@types/node`, `@types/react`, `@types/react-dom`.

### 9.6 Berkas standar tambahan (rekomendasi untuk semua project baru)

| Berkas                    | Fungsi                                                             |
| ------------------------- | ------------------------------------------------------------------ |
| `.editorconfig`           | Samakan indent/charset/EOL lintas editor (bukan cuma VS Code).     |
| `.vscode/settings.json`   | `formatOnSave` + ESLint fix on save, default formatter = Prettier. |
| `.vscode/extensions.json` | Rekomendasi extension (ESLint, Prettier, Tailwind IntelliSense).   |
| `.bun-version`            | Pin versi Bun agar seragam di tim & CI.                            |
| `.env.example`            | Template env (`NEXT_PUBLIC_API_URL`, dll).                         |
| `.gitignore`              | Standar Next.js + `.env*`, `bun.lock` di-commit.                   |
| `README.md`               | Cara setup & jalanin (`bun install`, `bun run dev`).               |

## 10. Strategi Boilerplate Reusable

Tujuan Anda: bikin project baru cukup dengan **nama + lokasi**. Dua opsi:

- **Opsi A — Template Repository (rekomendasi).** Jadikan hasil setup ini sebuah repo
  template di GitHub (tandai "Template repository"). Project baru = klik _Use this template_
  atau `gh repo create <nama> --template <template-repo>`, lalu sesuaikan `config/site.ts`.
  Paling sederhana, tidak ada script untuk dirawat.
- **Opsi B — Script scaffold lokal.** Sebuah script `create-project.sh <nama> <lokasi>`
  yang menyalin folder boilerplate, mengganti placeholder nama project, lalu `bun install`.
  Lebih fleksibel (bisa interaktif) tapi ada script yang harus dirawat.

**Keputusan: Opsi A (Template Repository GitHub).** Project
`gki-graha-raya/company-profile` ini sekaligus jadi **referensi awal** template tersebut —
setelah selesai, tandai repo sebagai "Template repository", dan project baru cukup
`gh repo create <nama> --template <template-repo>` lalu sesuaikan `config/site.ts`.

## 11. Di Luar Lingkup (YAGNI)

- Tidak ada database, ORM, atau migrasi.
- Tidak ada autentikasi / admin panel (data dikelola aplikasi terpisah).
- Tidak ada state management global berat (Redux/Zustand) kecuali nanti benar-benar dibutuhkan.
- Tidak ada i18n multi-bahasa (default Bahasa Indonesia) kecuali diminta kemudian.
