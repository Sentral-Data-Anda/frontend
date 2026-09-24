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

Sidebar desktop (`components/layout/sidebar.tsx`) = seluruh chrome global
desktop, tanpa top bar: `AppIdentity` di atas, navigasi di tengah (satu-
satunya bagian yang scroll), pengguna + tombol Keluar di bawah. Warnanya navy
lewat token `--sidebar-*` di `:root` (tabel kontras di `globals.css`), bukan
dark mode. Tombol tepi bulat 24px putih bergaris, ikon chevron, "Ciutkan menu"/"Lebarkan menu" (di garis
kanan sidebar, di garis bawah baris identitas; hidup di pembungkus sticky di luar `<aside>`
karena aside `overflow-hidden`) meringkasnya jadi rail ikon 72px — Beranda +
ikon domain (tanpa Pencarian) — klik ikon domain melebarkan sidebar dan
membuka accordion domain itu, bukan pindah ke halaman domain (`/<domain>`
tetap untuk HP/tablet dan URL langsung); label tersembunyi (memudar
atau `sr-only`) sebagai nama aksesibel + tooltip Base UI. Ciut/lebar = satu gerakan
200ms `cubic-bezier(0.2,0,0,1)` (`SIDEBAR_MOTION`, mati di reduced-motion)
dengan **satu DOM**: isi rail dan isi penuh selalu ter-mount, ditukar lewat
varian `group-data-collapsed/sidebar:*` dari atribut `data-collapsed` di aside
— klik hanya membalik satu boolean, tidak me-mount apa pun. Ikon, logo, avatar
di pusat 36px pada kedua mode; label memudar dan terpotong; Pencarian dan sub-layar
dilipat lewat `grid-template-rows` dan `invisible` di rail; tombol rail domain
adalah overlay di atas `summary` yang crossfade lewat `visibility` + `opacity`.
Menu "Pencarian" (dulu "Cari modul atau layar") membuka `/modul`, layar
berjudul "Pencarian" yang untuk sekarang mencari modul dan layar.
Di rail, avatar membuka menu akun Base UI (nama + peran,
"Keluar"); mode penuh tetap tombol Keluar langsung. Keduanya memanggil
`logout()` di `logout-button.tsx`. Pilihan disimpan di cookie
`sidebar_collapsed` (`sidebar-collapse.ts`) yang dibaca `AppShell` di server,
jadi render pertama sudah benar. Cookie itu milik FE: `pickSessionCookies`
(`lib/api/cookie.ts`) menyaring header `Cookie` ke be-sada (BFF, logout,
`getSession`, refresh) hanya ke `accessToken`/`refreshToken`. Identitas yang sama dirender header Beranda lewat slot `leading`
`PageHeader`; slot kiri itu (identitas atau tombol back) hanya tampil < lg.

Keluar: `DELETE /api/v1/auth/logout` (route BFF statis) meneruskan ke be-sada
lalu **selalu** menghapus kedua cookie dan membalas 204, apa pun hasil
upstream; proxy tidak menyegarkan token untuk path ini. Klien lalu
`window.location.replace("/login")` — navigasi keras membuang cache TanStack
Query dan sesi di memori (PC bersama).

Jarak tepi halaman memakai token `px-gutter` (20px, `--spacing-gutter` di
`globals.css`), bukan `px-4` per komponen. Warna hanya lewat token semantik
(`primary`, `muted-foreground`, `success`, `warning`, `destructive`, …) yang
dipetakan ke skala brand di `globals.css`; langkah skala (`bg-primary-50`)
dan `font-bold` ditolak lint di layar.

Skala teks (**keputusan user, menggantikan skala 14/12/10 + input 16px**):
terbesar 12px di mobile/tablet dan 14px hanya di desktop, terkecil 10px.
Hierarki lewat bobot dan warna, bukan ukuran.

| Token          | < `lg` | ≥ `lg` | Peran                                   |
| -------------- | ------ | ------ | --------------------------------------- |
| `text-title`   | 12px   | 14px   | judul halaman/bagian, sapaan, angka 404 |
| `text-body`    | 12px   | 12px   | isi, label, tombol, **input**, galat    |
| `text-caption` | 10px   | 10px   | keterangan, meta, hint, badge           |

Pengecualian (keputusan user 2026-09-22): label tab bawah dan status daftar
(badge `success`/`neutral`) 12px — `text-body` ditulis eksplisit.

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

**Persona (Beranda per izin).** `MOCK_PERSONA` memilih peran yang login;
pohon menu hanya berisi layar yang diizinkan (seperti `menuService.findTree`
be-sada) dan endpoint menjawab 403 untuk izin yang tidak dipegang:

```bash
bun run dev:mock                          # admin (bawaan): 12 domain / 61 layar, semua aksi
MOCK_PERSONA=sekretariat bun run dev:mock # sekretariat
MOCK_PERSONA=bendahara bun run dev:mock   # keuangan, kas keluar, persembahan
MOCK_PERSONA=majelis bun run dev:mock     # persetujuan, keuangan, anggaran, ulang tahun
```

Tiruan meliputi endpoint dashboard v2: `/faktur-supplier`, `/pembayaran`,
`/payroll`, `/periode-fiskal`, `/jurnal`, dan `/report/jemaat/type-gender`
(filter `status` bernilai tunggal, persis seperti be-sada).

Varian tiruan untuk **form jemaat**: `MOCK_SAVE_ERROR=validasi` (400 dengan
`issues[]` — harus mendarat di fieldnya masing-masing), `=induk` / `=email`
(pesan unik → fieldnya), `=kepala` (kepala keluarga ganda → field peran),
`=500` (galat tingkat form, isian tetap ada); `MOCK_DDL_EMPTY=1` (semua daftar
pilihan kosong), `MOCK_DDL_MANY=1` (keluarga 400 baris, membuktikan
`?filter=&limit=20` sisi server), `MOCK_NO_UPDATE=1` (aksi "Ubah" per baris
hilang). Jemaat yang ditambahkan lewat form benar-benar masuk ke daftar tiruan
(di memori), supaya baris baru dan sorotannya bisa dilihat.

`MOCK_MAJELIS_NO_FINANCE=1` (majelis tanpa `LAPORAN_KEUANGAN` — sel KPI dan
grafik keuangan hilang, grid merapat), `MOCK_NO_APPROVAL=1` (antrean
persetujuan kosong). Tiruan hanya meniru endpoint yang ada di be-sada
(`scripts/mock-dashboard.ts`, dengan rujukan berkas be-sada per endpoint);
widget yang endpoint-nya belum ada memakai fixture `SHOW_DUMMY`
(`src/features/beranda/dummy.ts`) dan tidak muncul di build production.

Varian tiruan: `MOCK_NO_CREATE=1` (tanpa tombol Tambah), `MOCK_500=1` (daftar
jemaat & ibadah galat), `MOCK_NO_IBADAH=1` (tidak ada ibadah hari ini), `MOCK_SINGLE_LEAF=1`
(bersama `MOCK_PERSONA=admin`: Peribadahan hanya punya Ibadah → tile-nya dan `/peribadahan` langsung ke
layar itu; Pengaturan tidak dipegang → `/pengaturan` 404), `MOCK_MANY_JEMAAT=1`
(60 jemaat; buka `?limit=5` di desktop untuk elipsis pager), `MOCK_FAIL_PAGE=3`
(halaman 3 menjawab 500 — baris "Gagal memuat" di mobile), `MOCK_API_ONLY=1`
(hanya tiruan API, untuk `next start` hasil build di port lain). Port
bisa digeser dengan `MOCK_API_PORT` dan `PORT`, tapi Next menolak `next dev`
kedua di direktori yang sama — matikan yang lama dulu.
Nama domain & layar di tiruan disalin dari be-sada (`NAME` di
`scripts/menu-tree.ts`) — perbarui bersama `MENU_TREE` be-sada.

### Kanvas & permukaan

Latar seluruh `(app)` adalah `bg-canvas` (primary-50), dipasang sekali di
`AppShell`. Apa pun yang harus putih menulis `bg-card` sendiri (kartu,
bottom tab, sheet; sidebar desktop navy); `DataList` tidak — barisnya rata di kanvas. Jangan pakai `bg-muted` sebagai bidang
di atas kanvas — nilainya sama (primary-50) dan tidak terlihat.

### Layar isian (form)

Bentuknya satu dokumen: **[docs/design/form-pattern.md](../docs/design/form-pattern.md)**.
Layar pertamanya `features/kejemaatan/daftar-jemaat/form-screen.tsx`, dipakai
dua rute: `/kejemaatan/daftar-jemaat/baru` dan `/kejemaatan/daftar-jemaat/[code]/ubah`
(kunci `code`, bukan `publicId` — daftar be-sada tidak mengirim `publicId`).

Form adalah **halaman rute sendiri** di semua ukuran, tujuh kelompok
`<fieldset>` urut cara bertanya. Lebarnya lebar konten biasa (penuh di HP, 672px
di tablet); di desktop judul kelompok di kiri dan field di kanan dalam grid dua
kolom, kolom form dibatasi 1152px. Kerangkanya `FormLayout` +
`FormSection` + `FormActions` di `components/common/form-layout.tsx`; baris
aksi menempel di bawah layar < lg (di atas bottom tab) dan ikut mengalir ≥ lg.

| Hal                                                    | Aturannya                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kapan galat muncul                                     | `mode: "onSubmit"` + `reValidateMode: "onChange"` — galat pertama kali muncul saat **Simpan** ditekan, lalu hilang begitu isinya benar saat diketik. Tidak ada galat yang muncul saat field ditinggalkan (blur). Satu pengecualian: `DateField` memeriksa ketikannya saat blur, di baris pesannya sendiri yang bertinggi tetap                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Submit dengan galat                                    | RHF memindahkan fokus, layar menggulir ke field galat pertama. Tanpa ringkasan galat di atas form                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Yang ditandai                                          | Yang **opsional** (` (opsional)` pudar), bukan yang wajib — di form ini hampir semua wajib                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Menyimpan                                              | Seluruh `<fieldset>` disabled + tombol "Menyimpan…". Tanpa overlay                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Berhasil                                               | Toast berisi `message` dari server, lalu kembali ke daftar lewat `afterSavePath` (filter terakhir + baris tersorot)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Gagal                                                  | `applyServerError` di `lib/form-error.ts`: `issues[]` → per field, pesan unik yang dikenal → fieldnya, sisanya galat tingkat form. Isian tidak pernah dibuang                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Keluar dengan isian kotor                              | `beforeunload` + `ConfirmDialog`. Tombol back peramban tidak bisa dicegat App Router — diterima                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Field relasi                                           | `SelectField` ≤ ±15 nilai tetap, `ComboboxField` di atas itu. 404 dari `ddl/*` = daftar kosong, bukan galat                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Alamat                                                 | Empat tingkat; mengubah tingkat atas mengosongkan yang di bawahnya, tingkat bawah terkunci sampai atasnya terisi                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Popup pilihan                                          | `FIELD_POPUP`/`FIELD_ITEM` menumpang `MENU_POPUP`/`MENU_ITEM` — satu bahasa dengan menu sidebar. `Select.Positioner` WAJIB `alignItemWithTrigger={false}`: bawaan Base UI `true` membuat popup menimpa pemicunya sendiri. Tinggi dibatasi `min(18rem, --available-height)`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Penanda opsional                                       | Kelompok yang mayoritas opsional memakai `FormSection` prop `note` (satu kalimat), bukan "(opsional)" di tiap field                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Placeholder                                            | Satu aturan: `Pilih <label huruf kecil>`, Select maupun Combobox. Kecuali tingkat alamat terkunci, yang menyebut apa yang harus dipilih dulu                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Ruang gulir                                            | `scroll-padding-bottom` 112px dipasang `globals.css` lewat `:root:has(form[data-slot="form-layout"])` — layar tidak mengatur padding sendiri                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Tanggal                                                | `DateField` **milik sendiri**, bukan `<input type="date">`: kotak diketik `dd/mm/yyyy` (pemisah apa pun diterima, tahun dua digit ditolak), baris konfirmasi "12 Mei 1990 · Sabtu · 36 tahun", kalender `Popover` ≥ lg dan panel penuh < lg. Logika murni di `src/lib/date.ts`, tampilan selalu lewat `formatDate`. Kontrak: `docs/design/date-input.md §7`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Pesan galat tidak boleh menggeser tata letak saat klik | Dicegah di SUMBERNYA: validasi saat submit, bukan saat blur. Blur terjadi pada `mousedown` kontrol berikutnya; galat yang muncul saat itu menggeser kontrol, `mouseup` jatuh di tempat lain, dan `click` tidak pernah terbentuk. Karena itu `FormField` TIDAK memesan slot kosong — pesan hanya memakan ruang bila ada. Ritme: label → kontrol 6px, kontrol → pesan 6px, lalu SATU jarak ke label berikutnya milik pembungkusnya (`FormSection` 16px, form login 20px), sama untuk field berpetunjuk, tanpa petunjuk, dan bergalat. Satu-satunya slot bertinggi tetap ada di `DateField`, karena ia memang memvalidasi saat blur; slot itu selalu berisi satu baris (petunjuk, konfirmasi, atau galat)                                                                                                                                                    |
| Pesan galat berdiri sendiri                            | Karena galat MENGGANTIKAN petunjuk, contoh atau akibat yang tadinya dibawa petunjuk wajib ikut disebut di pesan galatnya — kalau tidak, informasinya hilang tepat saat user paling membutuhkannya. Contoh: "Kode induk wajib untuk Anggota; juga jadi username akun." dan "Alamat wajib diisi, mis. Jl. Merdeka 10, RT 01 RW 02."                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Pemicu yang membuka saat ditekan                       | Jangan. Buka pada `click` biasa. Membuka pada `pointerdown` di atas pemicu pustaka yang sudah menoggle sendiri (mis. `Popover.Trigger` Base UI) membuat urutannya tekan→buka, lepas→toggle→tutup, sehingga popup tidak pernah terbuka dengan tetikus; dan di layar sentuh gerakan menggulir yang dimulai di atas tombol ikut membukanya. Masalah klik yang tertelan diselesaikan di sumbernya (baris di atas), bukan di pemicunya                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Bilah aksi form                                        | `FormLayout` menerima `actions` sebagai prop, bukan anak: di bawah `lg` bilahnya selebar LAYAR dan menempel ke tepi bawah termasuk area aman, sementara isinya tetap sejajar kolom field; di `lg` ke atas ia mengalir di akhir form, selebar kolom, dengan garis atas. Rute form tidak memakai `PageContainer` — kolom `FormLayout` sudah menentukan lebarnya sendiri, dan pembungkus tambahan itu yang membuat bilahnya dulu mengambang                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Garis pemisah kelompok                                 | Simetris: isi terakhir → garis 20px, garis → judul kelompok berikutnya 20px, judul → isinya sendiri 12px. `<legend>` diapungkan (`float-left w-full`) karena bawaan peramban melukisnya DI garis atas fieldset, sehingga padding apa pun tidak pernah memberi ruang di atas judul                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Garis pemisah di tablet ke atas                        | Gutter kelompok menjadi margin (`md:mx-gutter`), sehingga garis berhenti tepat di tepi field, bukan 20px di luarnya. Di HP garis tetap selebar layar                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Tata letak desktop                                     | `FormSection` saat kolom form ≥ 44rem (container query `@container/form`, bukan breakpoint layar — ambangnya di antara kolom tablet 672px dan kolom desktop tersempit 754px): judul + `note` di kolom kiri 14rem, field di kanan. Field dua kolom hanya bila kolom kanan ≥ 36rem (container query, field ≥ 280px) — di 1024 dengan sidebar penuh kolom kanan 458px, jadi di sana field satu kolom. Lebar kolom form milik `shellWidthWide` di `components/layout/shell-width.ts` (`lg:max-w-6xl`, 1152px) supaya satu field paling lebar 420px. Field yang memang lebar (alamat lengkap, daftar riwayat) dibungkus `FormWide` — layar tidak menulis breakpoint. Urutan DOM tetap, jadi urutan baca dan Tab kiri ke kanan, baris demi baris; field yang saling bergantung ditulis berurutan (tipe jemaat sebelum kode induk/wilayah, provinsi → kelurahan) |
| Status form                                            | `FormActions` prop `status` (mis. "Belum lengkap: …"): di bawah `lg` di atas bilah yang menempel, di `lg` ke atas di KIRI tombol. Jangan taruh status di bawah kelompok terakhir — di desktop ia terbaca sebagai catatan milik kelompok itu. Catatan kelompok selalu lewat `FormSection` `note`, bukan paragraf di antara field                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

Tujuh komponen bersama yang lahir dari layar ini — semuanya tipis di atas Base
UI yang sudah terpasang, tanpa dependency baru: `select-field`,
`combobox-field`, `date-field`, `textarea`, `confirm-dialog`, `form-layout`
(termasuk `LoadingForm`), dan `toast` (`ToastHost` dipasang di `providers.tsx`
supaya pesan sukses selamat melewati perpindahan ke daftar).

**Galat simpan dipakai ulang semua form**, bukan hanya jemaat:
`applyServerError(error, setError, mapMessage?)` di `src/lib/form-error.ts`.
`FetchError` membawa `issues: [{ path, message }]` dari be-sada, dan `path`
bertitik sudah sebentuk dengan nama field react-hook-form.

### Layar daftar

`DataList` punya satu bentuk: rata di kanvas (keputusan user, menggantikan
kartu terkelompok), baris di gutter halaman tanpa kartu dan tanpa bayangan —
sama dengan "Hari ini" di Beranda. Memuat, kosong, dan galat juga rata di
kanvas. Garis pemisah digambar di badan baris (`data-slot="row-body"`), jadi
otomatis mulai dari tepi kiri judul sampai gutter kanan, berapa pun lebar
`leading`. Baris daftar memakai `<Avatar tone="soft" />` (lingkaran
primary-200) dan status berupa titik + teks tanpa bidang (`success` /
`neutral`) di semua baris — teksnya lolos kontras langsung di atas kanvas.
`DataListRow` belum punya `href`, jadi belum ada chevron.

Paginasi berbeda PERILAKU per lebar, dan layar tidak tahu mode mana yang aktif:
fitur memanggil `useListQuery` (lihat `useJemaatList`) lalu meneruskan
`items`/`isLoading`/`isRefreshing`/`error`/`onRetry`/`pagination` ke `DataList`.

- **< lg (mobile/tablet)**: `useInfiniteQuery`. Halaman berikutnya ditumpuk saat
  tombol "Muat lebih banyak" di ujung daftar mendekati layar
  (`IntersectionObserver`, 400px); tombol yang sama bisa difokus/ditekan.
  `?page=` diabaikan; kunci query memuat filter, jadi ganti cari/status mulai
  dari halaman 1.
- **≥ lg (desktop)**: `useQuery` per halaman `?page=`, pager bernomor dengan
  elipsis di bawah daftar, tersembunyi bila hanya satu halaman.

**Tabel mulai tablet (keputusan user 2026-09-24).** `DataList` menerima prop
`table` (`DataTableConfig` dari `components/common/data-table.tsx`) dan memakainya
begitu layar ≥ md (`useIsTableWidth`, `TABLE_MEDIA_QUERY` = `--breakpoint-md`, dijaga
test). Paginasinya tetap milik `useListQuery`: tablet "muat lebih banyak" (baris
kerangka disisipkan di ujung tabel), desktop pager + 10/25/50. HP tetap baris
daftar. Keadaan (memuat, kosong, galat, menyegarkan) dan sorotan baris kembali tetap
milik `DataList`.

- Kerangka memuat = `LoadingDataList`: merender kerangka daftar DAN tabel, CSS
  (`md:hidden` / `hidden md:block`) yang memilih — juga dipakai sebagai fallback
  `Suspense` rute, yang dirender server tanpa JS. `loading-table.tsx` sengaja tanpa
  `"use client"`.
- Kolom = field yang memang dikirim endpoint daftar. Kolom `isSecondary` (Daftar
  Jemaat: Tipe, Keluarga) disembunyikan di tabel < 52rem (tablet, 1024 bersidebar
  penuh) lewat container query, jalur grid ikut berganti (`--cols-narrow`).
- Seluruh baris SATU tautan (isi kolom pertama diregangkan), `aria-label` bernama
  aksinya ("Ubah Andreas"); ikon di ujung (`rowIcon`) hanya penanda. Tanpa izin,
  `getRowHref` tidak diberikan: tanpa tautan, hover, dan ikon.
- Hover `bg-card` (putih): `muted` = kanvas di tema ini, jadi tidak terlihat.
- Bahasa tabel (kepala 10px kapital, garis baris, tautan diregangkan) satu sumber di
  `components/common/table-style.ts`, dipakai `DataTable` dan `DashboardTable`.
  Warna garis mengikuti permukaan: `hairline` di kartu putih, `border` di kanvas.
- Filter tambahan lewat skema `useListParams({ filters: { wilayah: { api: "zone" } } })`
  (list-state.md §2.5): `?wilayah=` di URL aplikasi, `zone` ke be-sada, kembali ke
  halaman 1. Layar tidak menulis nama parameter be-sada.
- `ListToolbar`: cari + `picker` (mis. wilayah) + chip. HP: kotak cari selebar kolom
  (tidak berubah — HP sudah disukai), pilihan jadi elemen pertama baris chip (8rem,
  setinggi chip). ≥ 36rem satu baris. Chip tidak menjorok di atas pilihan.
- Lebar halaman `PageContainer size="wide"` = `shellWidthWide`, SAMA dengan form.
  Tombol tambah: `PageHeaderAdd` (lingkaran < lg, "+ Tambah" ≥ lg).
- `DashboardTable` tidak dipakai ulang untuk daftar: ia ukuran kartu, tanpa keadaan,
  tanpa kepala menempel, tanpa `data-row-id`, tanpa kaki paginasi.

Batasnya `useIsDesktop` (`(min-width: 64rem)`, dijaga test agar sama dengan
`--breakpoint-lg` Tailwind). Selama hidrasi mode belum diketahui (`null`):
tidak ada yang mengambil data, skeleton tampil satu render, lalu tepat satu
permintaan. Invalidasi setelah menyimpan: awalan `xxxKeys.lists()` mengenai
kedua mode.

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

### Beranda per izin (dashboard)

Beranda disusun dari **registry widget** di `src/features/beranda/widgets.tsx`
(rancangan: `docs/design/dashboard-desktop.md`). Tiap widget punya `slot`
(`kpi` / `main` / `side`) dan `gate` = guard endpoint yang dibacanya;
`selectWidgets(session.menu)` memilih lewat `findMenuNode` — tidak pernah
`role.name`. KPI maks 4 sel, urutan tetap; main kosong → widget samping
pertama naik ke main. Tata letak milik `DashboardGrid` + `KpiStrip`
(`components/common`, container query: tumpuk < 40rem, main penuh + samping
2 kolom sampai 55rem, lalu [main 2fr │ samping 1fr]) dan `DashboardHeader`
(`components/layout`: sapaan, tanggal, maks 2 aksi dari izin, lonceng di ≥ lg).
Beranda memakai `PageContainer size="wide"`; layar lain `default`.

**v2 (bahasa C, `docs/design/dashboard-desktop.md` §10).** Strip KPI adalah
toolbar hairline berisi maks 5 sel dari SATU grup (`finance` atau `umum`,
yang selnya terbanyak setelah batas; seri → finance). Grup itu juga
menentukan jenis dashboard: widget ber-`kind` hanya tampil di jenisnya —
bendahara mendapat grafik 12 bulan, tabel "Perlu diselesaikan" (lima sumber,
gate per baris), saldo rekening, pemasukan per jenis, dan kesiapan tutup
buku; dashboard umum mendapat Agenda minggu ini, Menunggu tindakan saya, dan
jemaat per wilayah. Angka KPI memakai token `text-kpi` (14px < lg, 22px ≥ lg)
— satu-satunya teks di atas 14px. Beranda memakai `PageContainer
size="dashboard"`: mengisi kolom konten di desktop, dibatasi 100rem.

Menambah widget: komponen yang mengambil datanya sendiri (bungkus
`DashboardCard` dengan `query` → kerangka `minHeight` + galat per kartu;
tabel memakai `DashboardTable`, status memakai `Badge`, keadaan kosong
memakai `EmptyState isCompact`), lalu satu entri di `WIDGETS`. Teks bertanggal yang dirender tanpa menunggu
query memakai `useNow()` (aman hidrasi). Cek per persona:
`MOCK_PERSONA=bendahara|majelis|sekretariat bun run dev:mock`.

### Data dummy Beranda

Widget yang endpoint-nya belum ada di be-sada — **Jadwal pelayanan saya**
(juga tab "Tugas saya" di Agenda), **Pagu terpakai**, KPI **komisi > 80%
pagu**, **Kesiapan pembukuan** — dan **lonceng notifikasi** memakai fixture di
`src/features/beranda/dummy.ts`. Widgetnya ditandai `isDummy` di registry dan
hanya dirender bila `SHOW_DUMMY` — `process.env.NODE_ENV !== "production"`. Di
production semuanya tidak muncul sama sekali (diuji di
`widgets.test.ts` per persona). `dev:mock` tidak meniru endpoint yang tidak ada.

Menyalakannya di production (hanya bila diminta, mis. untuk demo): ubah baris
itu menjadi
`process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_SHOW_DUMMY === "1"`
lalu build dengan `NEXT_PUBLIC_SHOW_DUMMY=1`. Nilainya ditanam saat **build**,
bukan saat start. Saat endpoint asli ada: ganti fixture dengan hook data dan
hapus `isDummy` widget itu.

## Struktur

Konvensinya satu dokumen: **[docs/design/frontend-structure.md](../docs/design/frontend-structure.md)**
— empat lapisan dan arah impornya, bentuk folder fitur (`api.ts`, `model.ts`,
`screen.tsx`, `ui/`, `hooks/`), istilah yang dipakai (tidak ada "service" di
frontend), dan aturan lint yang menegakkannya.

Ringkasnya: `src/app` rute saja, `src/features/<domain>/<fitur>` satu fitur
nyata, `src/components/{ui,common,layout}` UI bersama, dan `src/lib`,
`src/config`, `src/hooks`, `src/types` fondasi. Yang bukan bagian dari
konvensi itu: `src/proxy.ts` (CSP per-request; di Next 16 dulu bernama
`middleware`) dan `public/sw.js` (service worker, ditulis tangan).

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
