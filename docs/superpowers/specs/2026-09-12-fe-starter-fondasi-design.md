# Desain: fe-starter — Fondasi & Gerbang (Fase 0 + 1)

Tanggal: 2026-09-12
Status: disetujui, siap direncanakan

## 1. Latar belakang

Repo `fe-sada` sudah memuat fondasi frontend yang matang: validasi environment
fail-fast, Content Security Policy berbasis nonce, service worker dengan daftar
putih, penjaga keamanan cache pada klien API, logging terstruktur dengan
redaksi, dan konvensi commit yang ditegakkan. Nilai terbesarnya bukan kodenya,
melainkan komentar yang menjelaskan **kenapa** tiap keputusan diambil — mode
kegagalan yang dicegahnya sebagian besar tidak memunculkan error apa pun ketika
dilanggar.

Fondasi itu sekarang terikat pada satu aplikasi. Tujuan pekerjaan ini adalah
mengangkatnya menjadi starter generik yang dipakai sebagai titik awal setiap
project frontend berikutnya.

Dokumen ini mencakup Fase 0 dan Fase 1 saja. Fase 2 (auth), Fase 3 (data layer
dan contoh CRUD), dan Fase 4 (PWA digenerikkan) mendapat spec dan rencana
masing-masing.

## 2. Keputusan yang sudah diambil

| Kode | Keputusan                                                                                     | Alasan singkat                                                                                                           |
| ---- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| S1   | Starter hidup di repo terpisah (`fe-starter`), bukan menandai fe-sada sebagai GitHub template | SADA tetap berjalan sendiri; project baru meng-clone starter yang sudah bersih, bukan membersihkan sisa SADA setiap kali |
| S2   | Dibangun dengan fork-and-strip, bukan `create-next-app` baru                                  | Komentar peringatan adalah aset paling mahal di repo ini dan paling gampang tertinggal saat mengetik ulang               |
| S3   | Bukan monorepo dengan package bersama                                                         | Versioning, build package, dan tooling monorepo adalah biaya tetap yang belum terbayar pada project kedua                |
| S4   | Dua jalur deploy dipertahankan: Vercel (default) dan Docker                                   | Sebagian project ke depan self-host; keduanya harus tetap terbukti bisa dibangun                                         |
| S5   | Auth mengasumsikan cookie HttpOnly yang di-set backend                                        | Next tidak pernah memegang token; paling aman. Detailnya di spec Fase 2                                                  |
| S6   | Starter menyertakan satu contoh CRUD utuh                                                     | Pola yang tidak pernah dijalankan end-to-end akan dirakit berbeda oleh tiap developer. Detailnya di spec Fase 3          |

## 3. Fase 0 — Bootstrap dan degenerikkan

### 3.1 Pembentukan repo

Repo baru `fe-starter` dibuat dari `git clone` repo ini, dengan history utuh.
History dipertahankan karena tiap keputusan arsitektur di dalamnya bisa
ditelusuri kembali ke commit dan diskusinya.

### 3.2 Identitas dipusatkan

`src/config/site.ts` dan `src/config/brand.ts` digabung menjadi
`src/config/app.ts`.

Alasan pemisahan aslinya tidak dilanggar oleh penggabungan ini: keduanya
konstanta murni yang tidak pernah menyentuh `process.env`, dan larangan
menyentuh env di berkas yang ikut ke bundle browser tetap berlaku pada berkas
gabungan. Yang berubah hanya jumlah tempat yang harus diedit ketika starter
dipakai: satu, bukan dua.

`src/config/navigation.ts` tetap terpisah. Isinya data rute, bukan identitas,
dan berubah terus sepanjang umur project.

Tidak ada gerbang otomatis yang memeriksa apakah nama aplikasi sudah diganti.
Kegagalannya terlihat pada judul tab browser dalam hitungan detik; gerbang untuk
itu lebih mahal daripada bug yang dicegahnya.

### 3.3 Aset dan teks yang diganti placeholder

- Nama, nama pendek, dan deskripsi aplikasi.
- Warna brand, warna latar splash, dan `themeColor` terang/gelap.
- Empat ikon PWA (`icon-192`, `icon-512`, `maskable-192`, `maskable-512`),
  ditambah `src/app/icon.png` dan `src/app/apple-icon.png`.
- `src/components/common/logo.tsx`.

Ikon placeholder dibangkitkan sekali dan ikut di-commit. Starter harus bisa
dijalankan dan dipasang sebagai PWA sejak clone pertama, sebelum siapa pun
punya logo.

Ikon `maskable` tetap berupa berkas terpisah dari ikon `any`, mengikuti alasan
yang sudah tertulis di `src/app/manifest.ts`: satu berkas dengan
`purpose: "any maskable"` membuat logo tampak kekecilan di desktop.

### 3.4 Yang dihapus

- Dua spec di `docs/superpowers/specs/` yang khusus SADA dan situs profil
  gereja.
- README lama.
- Kode mati yang ditemukan saat audit: `src/lib/format.ts`,
  `src/types/api.ts` (tipe `Paginated`), `src/components/common/empty-state.tsx`.
  Ketiganya nol pemanggil.
- `@commitlint/config-conventional` dari devDependencies.
  `commitlint.config.mjs` mendefinisikan seluruh rules-nya sendiri dan tidak
  memakai `extends`, jadi paket itu tidak pernah dimuat.

`Paginated` memang akan dibutuhkan pada Fase 3. Ia ditulis ulang saat ada
pemanggil nyata, bukan dibiarkan menunggu — tipe spekulatif yang menunggu
pemakai cenderung tidak cocok dengan bentuk data yang akhirnya datang.

`InstallPrompt` saat ini diekspor dari barrel `src/features/pwa/index.ts` tetapi
tidak dipasang di pohon komponen mana pun. Ia tidak dihapus di sini karena
merupakan fitur nyata yang belum terpasang; penyelesaiannya (dipasang atau
dibuang) menjadi bagian Fase 4.

### 3.5 Yang digenerikkan, bukan dihapus

Komentar di berkas-berkas berikut menyebut konteks gereja secara spesifik:
`public/sw.js`, `src/proxy.ts`, `src/lib/security/csp.ts`,
`src/lib/api/client.ts`, `src/app/robots.ts`, `src/app/manifest.ts`,
`src/instrumentation.ts`, `src/config/*`.

Istilahnya diganti, argumennya dipertahankan utuh:

- "data jemaat" menjadi "data terautentikasi"
- "PC sekretariat" menjadi "perangkat bersama"
- "pengurus" menjadi "pengguna"
- referensi ke spec SADA (D1, D2, D6/D7) diganti penjelasan singkat yang
  berdiri sendiri, karena spec yang dirujuk tidak ikut ke starter

Ini bagian pekerjaan yang paling menentukan nilai starter. Kode tanpa komentar
ini bisa diambil dari mana saja; alasan di baliknya tidak.

### 3.6 `robots.ts` tetap melarang seluruh crawl

Default starter adalah aplikasi terautentikasi. Project yang ternyata situs
publik mencabutnya dengan satu baris. Arah salah yang murah diperbaiki dipilih
di atas arah salah yang mahal: halaman terautentikasi yang sudah terindeks butuh
berminggu-minggu untuk dihapus dari hasil pencarian.

### 3.7 README arsitektur

README starter ditulis untuk orang yang baru meng-clone repo dan belum pernah
melihat kodenya. Isinya, berurutan:

1. **Apa ini** — satu paragraf: starter frontend beropini, untuk aplikasi
   terautentikasi, sudah membawa gerbang kualitas dan keamanan.
2. **Stack** — Next.js (App Router), React, TypeScript, Tailwind, Bun sebagai
   runtime dan package manager, Zod, base-ui/shadcn. Tiap baris menyebut versi
   dan satu kalimat alasan dipilih.
3. **Mulai cepat** — clone, `bun install`, salin `.env.example`, `bun run dev`.
4. **Ganti identitas** — daftar periksa berkas yang harus diedit ketika starter
   dipakai untuk project baru (`src/config/app.ts`, ikon, `navigation.ts`,
   `robots.ts` bila publik).
5. **Peta arsitektur** — pohon `src/` beserta peran tiap direktori, dan aturan
   arah impor: `app/` boleh mengimpor `features/`, `components/`, `lib/`,
   `config/`; `features/` tidak boleh saling mengimpor lintas fitur, melainkan
   lewat barrel `index.ts` masing-masing; `lib/` tidak boleh mengimpor
   `features/` maupun `app/`.
6. **Alur permintaan** — dari `proxy.ts` (nonce CSP) ke Server Component ke
   `apiClient` ke backend, dan jalur error balik lewat `instrumentation.ts`.
7. **Keamanan** — CSP dan alasan memakai nonce; aturan cache pada `apiClient`
   dan kenapa `no-store` menjadi default; aturan daftar putih service worker.
   Tiap bagian menunjuk berkasnya.
8. **Environment** — tabel variabel, wajib/opsional, dibaca saat build atau
   runtime, dan konsekuensi prefiks `NEXT_PUBLIC_`.
9. **Gerbang kualitas** — apa yang dijalankan CI, apa yang dijalankan husky, apa
   yang dijalankan Vercel, dan kenapa `build` sengaja tidak ada di CI.
10. **Test** — apa yang diuji unit test, apa yang diuji e2e, dan kenapa
    pembagiannya begitu.
11. **Deploy** — Vercel sebagai default, Docker sebagai alternatif, dan berkas
    apa saja yang dihapus bila salah satunya tidak dipakai.
12. **Observability** — bentuk log, apa yang diredaksi, cara menyambungkan
    penyedia eksternal, dan peran `digest` dalam menghubungkan laporan pengguna
    dengan baris log.
13. **Konvensi** — nama branch, format commit, alur PR.
14. **Peta jalan** — Fase 2 sampai 4, supaya pembaca tahu apa yang belum ada.

### 3.8 Verifikasi sekali jalan

`grep -ri "sada\|gki\|jemaat\|graha\|gereja"` pada working tree harus tidak
mengembalikan apa pun di akhir Fase 0, sebelum starter dinyatakan siap dipakai.

Bukan sebelum commit pertama: repo dibentuk lewat clone, jadi push pertama
justru membawa seluruh isi SADA — itu memang titik awalnya. Yang harus bersih
adalah working tree di akhir Fase 0. History tetap memuat SADA, dan itu
disengaja (lihat S2).

Ini pemeriksaan satu kali, bukan job CI: setelah bersih, starter tidak akan
pernah punya SADA lagi, jadi gerbang permanen untuk itu tidak menjaga apa pun.

## 4. Fase 0 — Gerbang CI dan proteksi branch

### 4.1 Remote lebih dulu

`.github/workflows/ci.yml` sudah ditulis lengkap di repo ini tetapi belum pernah
dieksekusi sekali pun, karena repo belum punya git remote. Sampai ada satu run
hijau yang bisa ditunjuk, seluruh gerbang di bawah masih fiksi.

### 4.2 `ci.yml` tidak berubah

Empat step yang ada dipertahankan: lint, typecheck, audit, test. Tidak ada step
`build`, mengikuti pembagian kerja dengan Vercel yang sudah tertulis di komentar
berkas itu.

### 4.3 `e2e.yml` menguji preview Vercel

Trigger `on: deployment_status`, jalan hanya ketika `state == 'success'` dan
environment-nya preview. Playwright menembak `deployment_status.target_url`.

Konsekuensinya: e2e menguji artefak yang benar-benar akan dilihat pengguna, dan
tidak menambah satu menit pun waktu build — Vercel sudah membangunnya. Filter
environment wajib ada, kalau tidak deploy production ikut memicu workflow ini.

Untuk pengembangan lokal, `playwright.config.ts` membaca `E2E_BASE_URL`;
`webServer` hanya aktif ketika variabel itu kosong, sehingga `bun run e2e` di
laptop membangun dan menjalankan servernya sendiri.

### 4.4 `docker.yml` dengan filter path

Trigger: push ke `main`, dan pull request yang menyentuh `Dockerfile`,
`package.json`, `bun.lock`, atau `next.config.ts`. Build saja, tanpa push ke
registry — starter tidak tahu registry milik siapa.

Filter path dipakai karena membangun image pada tiap PR membuang dua sampai tiga
menit untuk perubahan yang tidak menyentuh proses build, sementara Dockerfile
yang tidak pernah dibangun akan basi tanpa ada yang tahu.

### 4.5 Proteksi branch di server

`main` diproteksi di GitHub dengan required status checks: `ci`, `e2e`, dan
status deployment Vercel. Hook `pre-push` bisa ditembus `--no-verify`; proteksi
sisi server tidak bisa.

`.husky/pre-push` tetap ada untuk umpan balik cepat, tetapi blok typecheck
sementara di dalamnya dicabut — persis seperti yang diperintahkan komentarnya
sendiri, dan hanya setelah CI terbukti hijau. Yang tersisa adalah validasi nama
branch dan larangan push langsung ke branch terproteksi.

Urutannya mengikat: proteksi server harus aktif **sebelum** gerbang lokal
dicabut, kalau tidak ada jendela waktu tanpa penjaga apa pun.

## 5. Fase 1 — Lapisan yang ditambahkan

### 5.1 Playwright: tiga test

**Test 1 — halaman utama render, console bersih.**
Playwright menyimak `console` dan `pageerror`; satu pelanggaran CSP membuat test
merah. Ini test paling berharga di repo. CSP dengan direktif yang salah tidak
melempar error apa pun di sisi server — ia memblokir skrip hidrasi dan
menyisakan layar putih di production. Tidak ada unit test yang bisa
menangkapnya. Tidak boleh ada toleransi flake.

**Test 2 — aset PWA terjangkau.**
`/manifest.webmanifest` mengembalikan JSON yang bisa di-parse;
`/sw.js` mengembalikan JavaScript dengan `Cache-Control` yang memuat `no-store`;
header keamanan global (`X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`) terpasang. Dua permintaan HTTP, tanpa siklus hidup service
worker, sehingga praktis bebas flake.

Test ini mengunci peringatan yang ditulis berulang di `src/proxy.ts` dan
`src/app/manifest.ts`. Fase 2 akan memasang pengalihan auth tepat di jalur itu;
test ini ditulis sekarang supaya Fase 2 tidak bisa merusaknya diam-diam.

**Test 3 — fallback offline.**
Service worker teregistrasi dan aktif, koneksi diputus, navigasi menyajikan
`/offline`. Satu-satunya cara membuktikan siklus hidup service worker;
happy-dom tidak punya `CacheStorage` sungguhan.

Test ini paling rawan flake karena waktu aktivasi service worker tidak
deterministik. Bila terbukti goyah setelah beberapa run, ia diturunkan menjadi
test lokal saja dan dikeluarkan dari CI — bukan ditambal dengan
`waitForTimeout`. Menunggu dengan durasi tetap mengubah test yang goyah menjadi
test yang lolos tanpa menguji apa pun.

### 5.2 Dependabot

`package-ecosystem: "bun"` (GA sejak Februari 2025, memperbarui `package.json`
sekaligus `bun.lock`) dan `package-ecosystem: "github-actions"`.

`commit-message` wajib diisi `prefix: "chore"` dengan `include: "scope"`.
Aturan `scope-empty: never` di commitlint akan menolak setiap PR bot yang
pesannya tidak membawa scope.

Renovate lebih baik dalam mengelompokkan dan automerge, tetapi menuntut
pemasangan GitHub App. Dependabot nol instalasi dan cukup untuk repo sebesar
ini.

### 5.3 Template pull request

Berisi daftar periksa gerbang: lint/typecheck/test hijau, e2e hijau, perubahan
env terdokumentasi di `.env.example`, dan README diperbarui bila arsitekturnya
berubah.

CODEOWNERS tidak ditambahkan. Untuk repo satu orang, berkas itu tidak pernah
dibaca siapa pun; ia ditambahkan ketika ada orang kedua.

### 5.4 Pemeriksaan `Origin` pada `/api/observability`

Permintaan yang header `Origin`-nya bukan origin aplikasi sendiri ditolak dengan 403. Endpoint itu terbuka dan menulis ke log; pemeriksaan ini menutup
penyalahgunaan lintas-origin yang sepele dengan beberapa baris kode.

Rate limit in-memory dipertahankan apa adanya, beserta komentar yang sudah jujur
menyatakan batasannya. Pembatas sungguhan tempatnya di lapisan infrastruktur.

## 6. Yang sengaja tidak dibangun

Empat butir dari audit awal dicoret, dengan alasannya masing-masing.

**SDK Sentry atau penyedia observability lain.** `src/lib/observability/logger.ts`
sudah menjadi satu-satunya tempat `console` boleh dipakai di seluruh repo; itu
sudah merupakan titik sambung. Menambahkan hook no-op di atasnya adalah
konfigurasi untuk nilai yang tidak pernah berubah. Starter juga tidak boleh
memilih vendor untuk project yang belum ada. README menunjuk fungsi mana yang
diedit; itu cukup.

**Rate limit berbasis Redis atau Upstash.** Menambah dependency sekaligus akun
pihak ketiga ke starter demi satu endpoint log. Pembatas sungguhan tempatnya di
WAF atau reverse proxy, dan itu keputusan infrastruktur tiap project.

**Bundle analyzer dan budget Lighthouse.** Belum ada masalah performa untuk
diukur. Gerbang yang tidak pernah merah akan berhenti dibaca.

**Gerbang coverage.** Angka coverage mengukur baris yang dieksekusi, bukan
perilaku yang dipastikan. Tiga test e2e di atas menahan lebih banyak daripada
ambang persentase mana pun.

## 7. Bukti selesai

Dijalankan, bukan diklaim:

1. Clone bersih, `bun install`, salin `.env.example` menjadi `.env.local`,
   `bun run dev` menyala tanpa ZodError.
2. `bun run lint`, `bun run typecheck`, `bun run test`, `bun run audit` hijau di
   lokal.
3. Satu pull request percobaan: `ci` hijau, `e2e` hijau, preview Vercel hijau,
   dan `docker` hijau ketika PR itu menyentuh `Dockerfile`.
4. `git push --no-verify` langsung ke `main` ditolak oleh server. Dibuktikan
   sekali; bila lolos, proteksi salah pasang.
5. `grep -ri "sada\|gki\|jemaat\|graha\|gereja"` tidak mengembalikan apa pun.
6. README dibaca ulang oleh orang yang belum pernah melihat repo ini, dan ia
   bisa menjalankan aplikasi serta menjelaskan alur permintaan tanpa bertanya.

## 8. Risiko yang diketahui

| Risiko                                                      | Mitigasi                                                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Test offline goyah terhadap preview Vercel                  | Turunkan menjadi test lokal bila terbukti; jangan tambal dengan penungguan berdurasi tetap |
| `deployment_status` ikut menyala untuk deploy production    | Filter environment di kondisi job                                                          |
| Unduhan browser Playwright memperlambat CI                  | Cache direktori browser Playwright pada runner                                             |
| Sisa istilah SADA lolos ke starter                          | Pemeriksaan grep sebelum commit pertama (§3.8)                                             |
| Dependabot gagal memperbarui `bun.lock` pada kasus tertentu | Diketahui upstream; bila terjadi, perbarui lock secara manual di PR bot                    |

## 9. Fase berikutnya

- **Fase 2 — Auth.** `getSession()` ber-`React.cache`, penerusan cookie di
  `apiClient`, route group `(auth)` dan `(app)`, pengalihan di `proxy.ts` dengan
  pengecualian aset PWA yang dijaga Test 2.
- **Fase 3 — Data layer dan contoh CRUD.** TanStack Query, react-hook-form
  dengan resolver Zod, komponen tabel, satu resource contoh yang berjalan penuh
  beserta handler mock.
- **Fase 4 — PWA digenerikkan.** Melepas asumsi aplikasi spesifik, menjadikan
  `src/features/pwa` satu folder yang bisa dihapus utuh, dan mendokumentasikan
  cara melepasnya.

Fase 2 mendahului Fase 3 karena bentuk `apiClient` dan aturan cache berubah
begitu ada kredensial yang ikut dalam permintaan.
