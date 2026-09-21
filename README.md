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

## Test

`bun test`. Environment DOM disiapkan `tests/setup.ts`, dimuat lewat
`[test].preload` di `bunfig.toml` — happy-dom plus `@testing-library/react`,
sehingga komponen dan hook bisa diuji, bukan hanya fungsi murni.

Satu hal yang penting dipahami sebelum menambah test: `tests/setup.ts`
**memulihkan `fetch`, `Headers`, `Request`, `Response`, `AbortController`, dan
`AbortSignal` milik Bun** setelah happy-dom mendaftarkan global-nya. happy-dom
membawa implementasi HTTP sendiri, dan test di `src/lib/api/client.test.ts`
menembak server HTTP lokal sungguhan — dengan fetch happy-dom, lima test
timeout/abort di sana berubah dari menguji sesuatu menjadi lolos-diam. Jangan
hapus pemulihan itu.

`cleanup()` dari Testing Library dipanggil manual di setiap berkas test
komponen; auto-cleanup-nya bergantung pada hook global Jest/Vitest yang tidak
ada di `bun test`.

## Responsif

Urutan review selalu **mobile → tablet → desktop**. Hanya dua breakpoint,
default Tailwind: `md` (768px) dan `lg` (1024px). `sm:`, `xl:`, `2xl:`,
`min-[…]`, dan `max-[…]` tidak dipakai di mana pun.

Siapa boleh menulis apa:

| Tempat                          | Boleh                                             |
| ------------------------------- | ------------------------------------------------- |
| `src/components/layout/**`      | media query `md:` / `lg:` (shell, sidebar, tab)   |
| `src/components/common/**`      | container query (`@container`, `@md:`)            |
| `src/app/(auth)/layout.tsx`     | media query — rumah seluruh responsif layar masuk |
| `src/app/**`, `src/features/**` | **tidak ada** — layar bebas breakpoint            |

Baris terakhir ditegakkan ESLint (`no-restricted-syntax`, beserta larangan
warna palet mentah, `-[#…]`, dan `dark:`); pembagian layout vs common adalah
konvensi review. Bukti aturannya: `bunx eslint --no-inline-config
tests/fixtures/eslint-kelas.tsx`.

Lebar konten milik shell, bukan layar: `shellWidth` di
`src/components/layout/shell-width.ts` — penuh → `md:max-w-2xl` →
`lg:max-w-3xl`. Di bawah `lg` navigasinya bottom tab; mulai `lg` sidebar
berlabel 16rem dari `session.menu`. Keduanya ditukar lewat CSS, bukan JS.

Jarak tepi halaman memakai token `px-gutter` (20px, `--spacing-gutter` di
`globals.css`), bukan `px-4` per komponen. Warna hanya lewat token semantik
(`primary`, `muted-foreground`, `success`, `warning`, `destructive`, …) yang
dipetakan ke skala brand di `globals.css`; langkah skala (`bg-primary-50`)
dan `font-bold` ditolak lint di layar.

Skala teks (**keputusan user, menggantikan skala 14/12/10 + input 16px**):
terbesar 12px di mobile/tablet dan 14px hanya di desktop, terkecil 10px.
Hierarki lewat bobot dan warna, bukan ukuran.

| Token          | < `lg` | ≥ `lg` | Peran                                    |
| -------------- | ------ | ------ | ---------------------------------------- |
| `text-title`   | 12px   | 14px   | judul halaman/bagian, sapaan, angka 404  |
| `text-body`    | 12px   | 12px   | isi, label, tombol, **input**, galat     |
| `text-caption` | 10px   | 10px   | keterangan, meta, hint, label tab, badge |

Nilainya di `globals.css` (`--font-size-title` naik di `@media (min-width:
64rem)`), jadi layar tidak menulis `lg:`. `text-sm`, `text-lg`, `text-[18px]`
dan ukuran bawaan Tailwind lainnya ditolak lint di **seluruh** `src/`,
termasuk `cva()` di `components/ui`. Konsekuensi input 12px: iOS Safari
auto-zoom saat fokus pada input <16px, dicegah `maximumScale: 1` di
`viewport` (`src/app/layout.tsx`) — di iOS pinch-zoom manual tetap bisa, di
Android Chrome pinch-zoom ikut mati. Diterima user.

Tinggi kontrol (**keputusan user**): input dan tombol **36px di semua
ukuran** (`--spacing-control`, dibaca `h-control`/`size-control`/
`pr-control`); radius 8px `rounded-control`. Di bawah pedoman sentuh iOS
44px, di atas minimum WCAG 2.2 AA 24px. Jadi ukuran default `ui/input.tsx`
dan `ui/button.tsx`. Ukuran tombol lain (xs 24 · sm 28 · lg 36) tetap. Input **tampil sama sebelum dan saat diketik**
(keputusan user): tidak ada border, ring, atau perubahan latar saat fokus —
penanda fokus hanya caret. Varian `filled` = bidang abu tanpa garis. Ini tidak
memenuhi WCAG 2.4.7 dan 1.4.11; diterima user. Invalid = latar
`destructive/10` + pesan galat. Baris daftar (56px) dan item navigasi tidak
ikut mengecil.

Pratinjau tiga ukuran sekaligus (development saja):

```bash
bun run dev:mock
# http://localhost:3000/dev/preview?path=/login                   (belum masuk)
# http://localhost:3000/dev/preview?path=/                        (Beranda)
# http://localhost:3000/dev/preview?path=/kejemaatan                (halaman domain)
# http://localhost:3000/dev/preview?path=/kejemaatan/daftar-jemaat
```

Tiga iframe: 390×844, 820×1180, dan 1440×900 (diperkecil 50%). `path` harus
path di origin ini. Framing same-origin hanya diizinkan di development.

Varian tiruan: `MOCK_NO_CREATE=1` (tanpa tombol Tambah), `MOCK_500=1` (daftar
jemaat & ibadah galat), `MOCK_NO_IBADAH=1` (tidak ada ibadah hari ini), `MOCK_SINGLE_LEAF=1`
(Peribadahan hanya punya Ibadah → tile-nya dan `/peribadahan` langsung ke
layar itu; Pengaturan tidak dipegang → `/pengaturan` 404). Port
bisa digeser dengan `MOCK_API_PORT` dan `PORT`, tapi Next menolak `next dev`
kedua di direktori yang sama — matikan yang lama dulu.
Nama domain & layar di tiruan disalin dari be-sada (`NAME` di
`scripts/menu-tree.ts`) — perbarui bersama `MENU_TREE` be-sada.

### Kanvas & permukaan

Latar seluruh `(app)` adalah `bg-canvas` (primary-50), dipasang sekali di
`AppShell`. Apa pun yang harus putih menulis `bg-card` sendiri (kartu, sidebar,
bottom tab, sheet); `DataList` bawaan sudah membungkus barisnya dalam satu
kartu putih bergutter (`DataListFrame`), `DataList inset` membiarkan baris di
atas kanvas. Jangan pakai `bg-muted` sebagai bidang
di atas kanvas — nilainya sama (primary-50) dan tidak terlihat.

### Layar daftar

`DataList` bawaan = satu kartu putih (radius 12px, `shadow-sm`, seperti kartu
kas Beranda) bergutter di atas kanvas; memuat, kosong, dan galat tampil di
kartu yang sama. Garis pemisah digambar di badan baris (`data-slot="row-body"`),
jadi otomatis inset dari tepi kiri judul sampai padding kanan kartu, berapa pun
lebar `leading`. Baris daftar memakai `<Avatar tone="soft" />` (lingkaran
primary-100) dan badge status ringan (`success` / `neutral`) di semua baris.
Paginasi ringkas `‹ 1 / 2 ›` rata tengah di bawah kartu, tersembunyi bila hanya
satu halaman. `DataListRow` belum punya `href`, jadi belum ada chevron.

### Halaman domain

`/<domain>` (`src/app/(app)/[domain]/page.tsx`) melayani 12 domain dari satu
berkas: `PageHeader` (nama domain) lalu grid tile bento
(`MenuTile`/`MenuTileGrid`, 2 kolom, 3 kolom saat konten ≥ 36rem). Isi grid =
anak simpul domain di `session.menu`; penjelasan per layar dari
`MENU_DESCRIPTION`, ikon per layar dari `MENU_LEAF_ICON` (keduanya di
`src/config/menu.ts`). Layar baru dari be-sada tanpa entri ikon memakai ikon
domainnya (`leafIcon`); `menu.test.ts` menolak ikon ganda dalam satu domain
berdasarkan pohon di `scripts/menu-tree.ts` — tambahkan layar baru di sana
juga. Tautan ke domain
selalu lewat `domainHref`/`domainEntryHref`, bukan string literal.
Penjaganya `resolveDomain` (diuji terpisah): slug asing atau domain yang tidak
dipegang → 404, domain berlayar satu → dialihkan ke layarnya.

Dua hal yang perlu diketahui saat memeriksa dengan curl:

- `dynamicParams = false` hanya ditegakkan `next dev`. Di production rute ini
  dinamis (membaca cookie) sehingga slug asing tetap sampai ke halaman dan
  ditolak `resolveDomain`. `/favicon.ico` karena itu disajikan sebagai berkas
  (`src/app/favicon.ico`), supaya permintaan otomatis browser tidak pernah
  sampai ke layout.
- `notFound()` dan `redirect()` di halaman mana pun di bawah `(app)` terjadi
  sesudah `(app)/loading.tsx` mulai di-stream, jadi status HTTP-nya 200 (isi
  404 / pengalihan lewat payload RSC dan `meta refresh`), bukan 404/307.
  Berlaku juga untuk `/<domain>/<layar>` yang belum dibangun.

### Semua modul

`/modul` memakai `DomainTileGrid` (`components/common/domain-tile.tsx`) — grid
4 kolom yang sama dengan "Aksi cepat" Beranda. Saat kolom cari berisi,
`searchModules` (`src/app/(app)/modul/module-grid.tsx`, diuji terpisah)
mengembalikan layar yang cocok lewat nama, `MENU_DESCRIPTION`, atau nama
domainnya, dirender dengan `MenuTile` (prop `domainLabel`).

### Data dummy Beranda

Kartu **Kas gabungan** dan **lonceng notifikasi** di Beranda masih dummy
(endpoint agregat kas dan modul notifikasi be-sada belum ada). Seluruh datanya
di `src/features/beranda/dummy.ts`, dan keduanya hanya dirender bila
`SHOW_DUMMY` — `process.env.NODE_ENV !== "production"`. Di production keduanya
tidak muncul sama sekali, dan string dummy-nya tidak ikut ke bundle client.

Menyalakannya di production (hanya bila diminta, mis. untuk demo): ubah baris
itu menjadi
`process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SHOW_DUMMY === "1"`
lalu build dengan `NEXT_PUBLIC_SHOW_DUMMY=1`. Nilainya ditanam saat **build**,
bukan saat start. Saat data asli ada: hapus `dummy.ts` beserta kedua
pemeriksaannya di `src/app/(app)/home-screen.tsx`.

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
| Error browser | `src/instrumentation-client.ts`      | Menangkap `error` dan `unhandledrejection`, mengirim ke `/api/observability`    |
| Penampung     | `src/app/api/observability/route.ts` | Memvalidasi lalu mencatat laporan dari browser                                  |
| Redaksi       | `src/lib/observability/redact.ts`    | Menyaring kredensial, query string, `cause`, dan `stack`                        |
| Keluaran      | `src/lib/observability/logger.ts`    | Satu baris JSON per peristiwa. Satu-satunya tempat `console` boleh dipakai      |

Penghubungnya adalah **`digest`**. Di production Next menyamarkan pesan error
asli dari user dan hanya menyisakan digest, yang ditampilkan di halaman error.
Digest yang sama ikut tercatat di log server — jadi laporan "muncul kode error
1a2b3c" bisa dipertemukan dengan baris lognya.

Penangkap error browser tinggal di `src/instrumentation-client.ts`, bukan di
komponen dalam root layout. Next memuat berkas itu sebelum aplikasi menjadi
interaktif dan di luar pohon React, sehingga dua kelas error yang paling parah
tetap terlaporkan: error yang terjadi saat hidrasi, dan error yang menjatuhkan
root layout — komponen di dalam layout tidak pernah mount pada kasus kedua.

Batas boundary error yang perlu diketahui:

- `src/app/error.tsx` tidak membungkus `layout.tsx` di segmen yang sama.
  Karena itu ada `src/app/global-error.tsx`, yang merender `<html>`/`<body>`
  sendiri dan mengimpor `globals.css` sendiri.
- `global-error` adalah Client Component. Root layout yang gagal **di server**
  tetap menghasilkan kerangka 500 bawaan Next (`<html id="__next_error__">`);
  UI kita muncul saat hidrasi di client. Yang tetap jalan pada kasus itu adalah
  `onRequestError` di server — digest-nya tercatat, jadi kejadiannya tidak
  hilang meski halamannya bukan milik kita.
- Karena `global-error` menggantikan root layout, kelas `.dark` tidak sampai ke
  sana dan halamannya selalu terang.

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

**Tidak ada `--ignore` sama sekali.** Sebelumnya ada lima, semuanya berujung
pada versi yang dipin Next sendiri (`postcss`, `nanoid`, `sharp`). Kenaikan
Next ke 16.3.5 membuat kelimanya tidak relevan lagi, dan daftarnya dibuang
seluruhnya: entri pengecualian yang sudah tidak perlu bukan sekadar sampah,
ia menyembunyikan advisory berikutnya yang kebetulan memakai id yang sama.

Satu `overrides` dipakai di `package.json`:

| Paket          | Dipaksa ke | Kenapa                                                                                                                                                                          |
| -------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `browserslist` | `^4.28.9`  | Dua advisory high (`GHSA-c83g-rgw3-j3cx`, `GHSA-73wf-gq98-2v4g`) menyasar `<=4.28.6`. Tanpa override, salinan bersarang di bawah `@babel/core` dan `shadcn` tertahan di 4.28.2. |

**Sebelum menambahkan `--ignore` baru, coba `overrides` lebih dulu.** Override
benar-benar mengganti versi yang terpasang; `--ignore` hanya membungkam
laporannya dan meninggalkan kode rentan di tempatnya. `--ignore` adalah jalan
terakhir untuk advisory yang memang tidak punya versi perbaikan, dan alasannya
wajib ditulis di sini.

## Konvensi Commit

`type(scope): subject` — scope wajib, subject huruf kecil, header maksimal 100
karakter. Type yang diterima: `feat`, `fix`, `slicing`, `docs`, `chore`,
`refactor`, `test`, `ci`, `perf`, `style`, `build`, `revert`.

Contoh: `feat(pwa): tambah manifest dan service worker`.

Nama branch: huruf kecil dan angka, dipisah `-`, boleh berprefiks tipe dengan
`/` (mis. `feat/pwa-2`). Push langsung ke `main`/`development`/`production`
diblokir.
