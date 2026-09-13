# Desain Slicing UI — Sentral Data Anda (SADA)

> Status: disetujui dalam percakapan 2026-09-13, belum diimplementasikan.
>
> Dokumen ini mengatur **bagaimana 61 layar SADA dibangun**: transport ke API,
> alur masuk, izin, struktur berkas, konvensi kode, dan kepustakaan komponen.
> Ia melengkapi — bukan menggantikan —
> `2026-08-13-sada-pwa-architecture-design.md`, yang mengatur lapisan PWA
> (manifest, service worker, push). Keputusan D1–D12 di dokumen itu tetap
> berlaku; yang di sini dinomori ulang dari D1 dan tidak merujuk ke sana
> kecuali disebut eksplisit.

## 1. Konteks & ruang lingkup

`fe-sada` saat ini baru berisi fondasi: PWA yang bisa dipasang, `apiClient`
sisi server dengan penjaga keamanan cache, `useBoolean`, `formatDate`, dan dua
primitif shadcn. Belum ada app shell, belum ada autentikasi, belum ada satu pun
layar aplikasi.

Yang dibangun: 12 domain / 61 layar daun, mengikuti `MENU_TREE` yang sudah
hidup di `be-sada` (`src/common/constants/menu.ts`). Daftarnya tidak diulang di
sini — be-sada adalah sumber kebenarannya, dan navigasi FE dirender dari
respons API, bukan dari daftar yang disalin.

Yang **tidak** dicakup dokumen ini: perubahan apa pun pada be-sada, desain
visual per layar (sudah ada mockup), dan layar Beranda (lihat §12).

Sasaran perangkat: iPhone 390×844 sebagai patokan utama. Desktop menyusul, dan
struktur di sini disiapkan supaya penambahannya tidak menuntut pembongkaran.

## 2. Ringkasan keputusan

| #   | Keputusan                                                                                     | Alasan singkat                                                             |
| --- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| D1  | Browser hanya bicara ke origin FE; Next meneruskan ke be-sada (BFF)                           | Cookie sesi jadi same-origin; tanpa CORS; selamat dari ITP Safari/iOS      |
| D2  | Amplop API `{ status, message, data }`, daftar menambah `totalData`/`totalPage` di level atas | Itu bentuk sesungguhnya be-sada; `Paginated<T>` yang ada sekarang salah    |
| D3  | HTTP 404 pada endpoint daftar diterjemahkan jadi daftar kosong                                | be-sada membalas 404 saat filter tak menemukan apa pun; itu bukan error UI |
| D4  | Sesi dan menu tree diambil satu panggilan `GET /auth/me`                                      | be-sada sudah menggabungkannya; satu perjalanan bolak-balik                |
| D5  | Alur masuk `/login` → `/authentication` → tujuan                                              | Satu tempat untuk cabang login-pertama dan layar tunggu bermerek           |
| D6  | `/authentication` Server Component + `loading.tsx`, bukan rantai `useEffect`                  | Nol state client; animasi muncul dari model streaming Next                 |
| D7  | Tanpa `jwt-decode`, tanpa `localStorage`                                                      | Cookie `httpOnly` tak terbaca JS, dan `/auth/me` tak butuh identitas       |
| D8  | `proxy.ts` hanya memeriksa keberadaan cookie                                                  | FE tak memegang kunci tanda tangan; otorisasi sudah ditegakkan be-sada     |
| D9  | Jeda minimum 800ms ditegakkan di server, bukan di client                                      | `loading.tsx` dicabut Next begitu kerja server selesai                     |
| D10 | TanStack Query untuk seluruh state data server                                                | Menghapus ±40 baris boilerplate per layar dikali 61 layar                  |
| D11 | react-hook-form + zod untuk form                                                              | Wizard 5 langkah dengan field wajib bersyarat                              |
| D12 | Filter/paginasi di URL lewat `useListParams` sendiri, tanpa `nuqs`                            | Empat parameter; ±40 baris di atas `useSearchParams` sudah cukup           |
| D13 | Struktur feature-sliced, bukan `containers`/`services`/`types` terpisah                       | Repo sudah memakai `src/features/`; satu layar tak tersebar di tiga pohon  |
| D14 | Layar dilarang memakai primitif shadcn langsung; wajib lewat wrapper                          | Mencegah 61 layar pelan-pelan berbeda tampilan                             |
| D15 | Konvensi `is`/`on`/`pick` dan urutan blok ditegakkan ESLint                                   | Aturan yang cuma ditulis di dokumen akan dilanggar di layar ke-40          |
| D16 | Mobile-first; shell memisahkan navigasi dari isi layar                                        | Desktop ditambahkan tanpa menyentuh 61 layar                               |
| D17 | Tiga komponen loading, dua bahasa visual                                                      | Animasi 2 detik salah tempat untuk simpan yang selesai 300ms               |
| D18 | Huruf S/A/D ditelusuri jadi SVG inline                                                        | 190 KB PNG untuk layar tunggu; SVG ikut tema gelap                         |
| D19 | Komponen dropdown berdata hanya boleh memanggil `/api/v1/ddl`                                 | Dropdown lintas menu; menaruhnya di service menu bikin fungsi kembar       |
| D20 | Beranda dikerjakan terakhir                                                                   | Angkanya belum punya endpoint agregat di be-sada                           |

## 3. Transport & kontrak API

### 3.1 BFF proxy (D1)

be-sada menaruh sesi di cookie `httpOnly` bertanda tangan. Cookie terikat pada
origin yang menerbitkannya. Bila browser di `app.sada.test` menembak
`api.sada.test` langsung, cookie hanya ikut bila be-sada mengaktifkan CORS
berkredensial dan menandai cookie `SameSite=None; Secure` — dan cookie
lintas-situs seperti itu diblokir makin agresif oleh Safari/iOS, tepat pada
perangkat yang paling banyak memakai aplikasi ini.

Karena itu browser tidak pernah menembak be-sada. Satu route handler
`src/app/api/[...path]/route.ts` meneruskan permintaan ke `env.API_BASE_URL`
di sisi server, membawa header `Cookie` masuk dan meneruskan `Set-Cookie`
keluar apa adanya. Bagi browser, cookie terbit dari origin yang sama —
`SameSite=Lax` cukup, CORS tidak diperlukan, dan be-sada tidak perlu diubah
sedikit pun.

Yang wajib diteruskan dua arah: `Cookie`, `Set-Cookie`, `Content-Type`,
`Authorization` (bila kelak dipakai), dan badan permintaan sebagai stream
(unggahan berkas lewat `multipart/form-data` tidak boleh di-buffer utuh).

Yang wajib TIDAK diteruskan: header `Host` asli, dan header apa pun dari
be-sada yang menggambarkan penempatannya.

Konsekuensi pada `src/proxy.ts`: `/api/*` sudah dikecualikan dari `matcher`
CSP, dan pengecualian itu harus tetap ada saat pengalihan auth ditambahkan
(lihat peringatan yang sudah tertulis di berkas itu).

### 3.2 Amplop respons (D2)

be-sada membalas lewat dua bentuk. Bentuk tunggal:

```ts
type ApiResponse<T> = { status: number; message: string; data: T };
```

Bentuk daftar menambah dua field **di level atas amplop**, bukan di dalam objek
`meta`:

```ts
type ApiListResponse<T> = ApiResponse<T[]> & {
  totalData: number;
  totalPage: number;
};
```

`src/types/api.ts` saat ini mendeklarasikan `Paginated<T>` dengan
`meta: { page, perPage, total, totalPages }`. Bentuk itu tidak pernah dikirim
be-sada dan harus diganti sebelum ada layar yang memakainya.

### 3.3 Daftar kosong bukan error (D3)

`jemaatController.getAllWithPagination` melempar `ApiError("...Tidak
Ditemukan", 404)` ketika hasil kueri kosong, dan pola itu terulang di modul
lain. Bagi UI, filter yang tidak menemukan apa-apa adalah keadaan normal yang
menampilkan "tidak ada data", bukan layar error.

Penerjemahan dilakukan **satu kali di fetcher**, bukan di 61 layar: permintaan
daftar yang dijawab 404 mengembalikan `{ data: [], totalData: 0, totalPage: 0 }`.
Permintaan satu record yang dijawab 404 tetap error — di situ 404 memang
berarti record tidak ada.

Pembedaannya eksplisit di tanda tangan fetcher (`fetchList` vs `fetchOne`),
bukan tebakan dari bentuk respons.

## 4. Autentikasi & alur masuk

### 4.1 Alur (D5)

```
/login            form. POST /api/v1/auth/login lewat BFF.
                  Sukses → replace("/authentication?redirect=<tujuan>")

/authentication   gerbang bootstrap. LoadingPage tampil selama kerja server.
                  GET /api/v1/auth/me
                    ACTIVE  → redirect(tujuan ?? "/")
                    PENDING → render <FormFirstLogin />
                    401     → redirect("/login")

/                 app shell + Beranda
```

`GET /api/v1/auth/me` bekerja tanpa perubahan be-sada:
`authController.getOne` mengabaikan `:code` di path dan bertindak atas
`req.user.code` — komentarnya menyatakan itu disengaja. Responsnya berisi user
**beserta seluruh menu tree dan `action[]` per slug**
(`authService.findUnique` memanggil `menuService.findTree`).

### 4.2 Kenapa Server Component (D6, D7)

Versi `fe-gkigraharaya` mengerjakannya di client lewat empat `useEffect`
berurutan: baca `?redirect`, baca `localStorage`, `jwtDecode(token)`, lalu
fetch. Tiga dari empat itu tidak punya alasan di sini:

- Cookie be-sada `httpOnly`; `jwtDecode` di browser mustahil dan tidak perlu.
- `localStorage["code-user"]` hanya menyimpan turunan dari poin di atas.
- `?redirect` dibaca dari `searchParams` milik Server Component.

Maka `page.tsx` adalah Server Component yang mengambil sesi dan memutuskan
percabangan, dan `loading.tsx` di sebelahnya merender `LoadingPage`. Next
menampilkan `loading.tsx` selama kerja server berlangsung dan mencabutnya saat
selesai — tanpa satu pun state, effect, atau timer di client.

Dependency `jwt-decode` dan `js-cookie` tidak dipasang.

### 4.3 Jeda minimum (D9)

`fe-gkigraharaya` menahan layar dengan `setTimeout(1000)` di client supaya
animasi sempat terbaca. Cara itu tidak tersedia di sini: `loading.tsx` dicabut
Next begitu kerja server selesai, terlepas dari apa pun yang dilakukan client.

Jeda dipasang di server, pada kerja yang sedang ditunggu itu sendiri:

```ts
import { setTimeout as delay } from "node:timers/promises";

const [session] = await Promise.all([getSession(), delay(800)]);
```

Kerja server jadi berdurasi minimal 800ms, dan `loading.tsx` bertahan selama
itu sebagai akibat wajar. Nilainya satu konstanta bernama, dan hanya berlaku
di `/authentication` — bukan di setiap navigasi.

### 4.4 `proxy.ts` (D8)

```
cookie sesi tidak ada, bukan halaman auth  → /login
cookie sesi ada, sedang di /login          → /authentication
/api/*, aset PWA                           → lewat
```

Yang sengaja TIDAK dilakukan: mendekode token dan mencocokkan peta rute ke hak
akses, seperti `menuAccessMap` di `fe-gkigraharaya`. FE tidak memegang kunci
tanda tangan be-sada, jadi klaim apa pun yang dibacanya tidak terverifikasi.
Lebih dari itu, peta seperti itu adalah daftar 30+ baris yang harus dijaga
manual dan akan basi diam-diam setiap kali rute bertambah.

Otorisasi sesungguhnya sudah ditegakkan be-sada pada setiap request
(`Authorization(MENU.X, "VIEW")` di setiap route). FE menyembunyikan menu dan
tombol lewat `action[]` dari menu tree — itu urusan tampilan, bukan keamanan,
dan dokumen ini menyebutnya begitu supaya tidak ada yang mengira sebaliknya.

Pengecualian aset PWA di `config.matcher` WAJIB tetap ada. Bila
`/manifest.webmanifest` ikut dialihkan ke `/login`, tombol install hilang tanpa
pesan error; bila `/sw.js` yang dialihkan, push notification mati diam-diam.

## 5. Izin

Menu tree dari `/auth/me` berbentuk pohon `MenuNode`:

```ts
{ publicId, slug, name, order, action: MenuAction[], children: MenuNode[] }
```

`action` sudah disintesis be-sada per peran — peran admin menerima seluruh
aksi tanpa bergantung pada baris grant. Dari situ satu hook:

```ts
const { isCanView, isCanCreate, isCanUpdate, isCanDelete } = useMenuAccess(
  MENU.DAFTAR_JEMAAT,
);
```

Tombol "Tambah" tidak dirender bila `isCanCreate` bernilai salah. Daftar menu
di "Semua modul" dirender dari pohon yang sama, bukan dari konstanta di FE —
menu yang ditambahkan be-sada muncul tanpa rilis FE.

Slug ditulis sebagai konstanta FE (`src/config/menu.ts`) supaya salah ketik
tertangkap compiler, dan satu test memastikan setiap slug di konstanta itu ada
di pohon yang dikirim API pada basis data pengembangan.

## 6. Struktur berkas (D13)

```
src/
  app/
    (auth)/
      login/page.tsx
      authentication/
        page.tsx          Server Component: sesi, cabang PENDING, redirect
        loading.tsx       LoadingPage
    (app)/
      layout.tsx          app shell + SessionProvider
      page.tsx            Beranda
      modul/page.tsx      "Semua modul"
      kejemaatan/daftar-jemaat/
        page.tsx          daftar
        tambah/page.tsx
        [code]/page.tsx   detail
        [code]/ubah/page.tsx
    api/[...path]/route.ts   BFF proxy

  features/<domain>/<sub-menu>/
    api.ts          kunci query, fetcher, hook query & mutation
    schema.ts       zod: bentuk form dan bentuk respons
    form.tsx        satu form, dipakai tambah dan ubah
    list-item.tsx   satu baris daftar
    types.ts

  components/
    ui/             primitif shadcn — tidak dipakai langsung dari layar
    common/         wrapper wajib (lihat §8)
    dropdown/       dropdown berdata, datar, semuanya menembak /ddl
    layout/         app-shell, bottom-tab, module-sheet

  lib/
    api/client.ts   sisi server, sudah ada
    api/fetcher.ts  sisi browser, lewat /api
  hooks/
  config/
```

`src/features/` sudah dipakai repo ini untuk `pwa` dan `observability`; ini
meneruskan pola yang ada. Nama berkas kebab-case mengikuti repo.

Struktur `containers/` + `services/` + `types/` terpisah gaya
`monorepo-apower-fe` sengaja tidak diadopsi: tiga pohon yang harus dijaga
cermin satu-banding-satu di sana sampai memerlukan skrip `check:structure`
untuk menegakkannya, dan biaya itu tidak dibayar oleh manfaat apa pun yang
tidak diberikan feature-sliced.

## 7. Konvensi kode (D15)

Diambil dari `STANDARDS.md` `monorepo-apower-fe`, disaring ke yang benar-benar
berlaku di sini:

1. Boolean diawali `is` — termasuk yang dibungkus `useBoolean`. `hasFetched`,
   `showModal`, `canSubmit`, `shouldRender` ditolak walau terdengar wajar.
   Satu-satunya awalan sah adalah `is`, supaya seluruh boolean bisa dicari
   lewat awalan yang sama.
2. Nama fungsi diawali `on`. State pilihan diawali `pick` (`pickStatus`,
   `pickSektor`).
3. Urutan blok di dalam komponen: **state → function → useEffect → return**.
4. `useState<boolean>` dilarang; pakai `useBoolean` yang sudah ada di
   `src/hooks/use-boolean.ts`.
5. Setiap `.map()` di JSX wajib `key` stabil dari data, bukan indeks.
6. Warna hardcode dilarang; hanya token Tailwind.
7. Komentar penanda seksi (`// State`, `// Functions`) dilarang — urutannya
   sudah diatur aturan 3.
8. Nilai yang bisa diturunkan dari state lain wajib `const`, bukan `useState`
   tersendiri.

Aturan 1–5 diperiksa mekanis lewat `no-restricted-syntax` dan
`eslint-plugin-check-file`. Aturan yang hanya hidup di dokumen akan dilanggar
diam-diam di layar ke-40; itu sebabnya penegakannya bagian dari Fase 0, bukan
catatan untuk nanti.

## 8. Kepustakaan komponen (D14)

`components/ui/` berisi primitif shadcn dan disentuh hanya saat menambah
primitif. Layar tidak mengimpor dari sana. Yang dipakai layar:

| Wrapper         | Tanggung jawab                                                |
| --------------- | ------------------------------------------------------------- |
| `PageHeader`    | back, judul, aksi kanan                                       |
| `ActionBar`     | baris tombol keputusan: Batal, Simpan, Hapus, Approve, Reject |
| `DataList`      | daftar + skeleton + keadaan kosong + error + infinite scroll  |
| `FilterChips`   | baris chip Semua / Sektor / Status / Komisi                   |
| `SearchInput`   | pencarian dengan debounce, tersimpan di URL                   |
| `FormField`     | label + kontrol + pesan galat + petunjuk kanan                |
| `WizardHeader`  | "Langkah 2 dari 5 · keanggotaan" + progress                   |
| `ConfirmDialog` | konfirmasi simpan dan hapus                                   |

Dua aturan turunan, keduanya diambil dari insiden nyata yang tercatat di
`STANDARDS.md`:

- **Layar dilarang merangkai baris tombol sendiri.** Begitu satu layar
  menyusun `<div className="flex justify-end gap-2">` berisi dua tombol, warna
  dan jarak ikut tersalin ke layar itu, dan dua halaman sejenis pelan-pelan
  berbeda tanpa ada yang sadar.
- **Komponen dropdown berdata hanya boleh memanggil `/api/v1/ddl`** (D19), dan
  tinggal datar di `components/dropdown/` tanpa sub-folder pengelompokan.
  Dropdown dipakai lintas menu; menaruh endpointnya di folder satu sub-menu
  membuat anggota lain tidak menemukannya dan menulis fungsi kembar.

Wrapper dibangun dari kebutuhan nyata layar pertama (Fase 3), bukan didaftar
lebih dulu lalu dicari pemakainya. Tabel di atas adalah perkiraan, bukan
kontrak yang harus lengkap sebelum layar pertama jalan.

Font: Instrument Sans lewat `next/font/google`, sesuai mockup.

## 9. Kerangka satu layar CRUD

Cetakan yang diulang 61 kali, jadi bentuknya ditetapkan sekarang:

```
features/kejemaatan/daftar-jemaat/
  api.ts        useJemaatList(params) · useJemaatDetail(code)
                useCreateJemaat() · useUpdateJemaat() · useDeleteJemaat()
  schema.ts     jemaatFormSchema (zod) · jemaatSchema (respons)
  form.tsx      react-hook-form; dipakai tambah dan ubah
  list-item.tsx
```

`page.tsx` tipis: baca parameter dari URL, panggil hook, render wrapper.

Yang **tidak** ada di dalamnya, karena TanStack Query sudah mengurusnya:
`useEffect` untuk fetch, flag `isLoading` yang diset manual, invalidasi cache
yang ditulis tangan, dan ref penjaga `isMounted`.

Perbedaan tambah dan ubah hanya pada mutation yang dipanggil — bukan dua form
yang ditulis terpisah (D11 bersama aturan ini menggantikan kerangka
`Container.tsx`/`Manage.tsx`/`Form.tsx` apower; pembagian tanggung jawabnya
tetap, wadahnya berubah).

Form wajib memakai tag `<form onSubmit>` dengan `e.preventDefault()` sebagai
baris pertama, bukan `onClick` pada tombol simpan. Dengan begitu Enter di dalam
input ikut menyubmit, `required` divalidasi browser, dan pembaca layar
mengenali bloknya sebagai formulir.

Filter dan paginasi hidup di URL lewat `useListParams` (D12): `page`, `search`,
`limit`, `status`, plus parser tambahan per layar. Ditulis di atas
`useSearchParams` dan `router.replace`; `nuqs` menyusul bila empat parameter
ternyata tidak cukup.

## 10. Komponen loading (D17, D18)

Dua bahasa visual, karena dua tugas yang berbeda:

| Komponen        | Rupa                                            | Dipakai saat                                                            |
| --------------- | ----------------------------------------------- | ----------------------------------------------------------------------- |
| `LoadingPage`   | animasi huruf S · A · D, penuh layar            | **hanya** cold start dan bootstrap: `(auth)/authentication/loading.tsx` |
| `LoadingGlobal` | cincin spinner + logo kecil, overlay transparan | mutation berjalan (simpan, hapus, approve) dan `(app)/loading.tsx`      |
| `LoadingList`   | skeleton baris daftar                           | daftar sedang dimuat, di dalam `DataList`                               |

Animasi huruf berdurasi 2 detik dan berakhir pada `opacity: 0`. Dipakai untuk
menutupi tunggu pendek — simpan yang selesai 300ms, atau pindah layar di dalam
app shell — yang terlihat hanya kedipan huruf setengah jalan. Karena itu
`LoadingPage` dibatasi ke satu tempat: `/authentication`, satu-satunya layar
yang memang ditahan minimal 800ms (§4.3). Segala tunggu lain memakai cincin
spinner atau skeleton.

`ModalLoading` dari apower tidak diadopsi. Trik `requestAnimationFrame`
bersarang di dalamnya memecahkan masalah yang lahir dari `setList(data)` dan
`isLoading.onFalse()` yang dibatch jadi satu commit berat; TanStack Query tidak
menghasilkan pola itu. Ditambahkan bila ternyata terbukti perlu.

Sumber animasi: `fe-gkigraharaya`
`src/components/Loading/custom.module.css` — huruf S masuk dari kiri, A dari
kanan, D dari bawah, masing-masing 2 detik, `ease-in-out`, `infinite`.
Keyframes-nya dipakai apa adanya.

Asetnya tidak. Tiga PNG di repo itu masing-masing 3000×3000 piksel dan ~60 KB
untuk satu bentuk datar satu warna yang dirender 200×200 — 190 KB untuk layar
tunggu, pada aplikasi yang layar tunggunya justru sedang dicoba diperhalus.
Ketiganya ditelusuri jadi path SVG inline. Selain jauh lebih kecil dan nol
permintaan jaringan, `fill="currentColor"` membuatnya ikut tema gelap, yang
tidak mungkin dengan PNG abu-abu.

Hasil telusur dibandingkan berdampingan dengan PNG aslinya sebelum dipakai.

## 11. Fase pengerjaan

| Fase  | Isi                                                                                                                                                                          | Hasil yang bisa dilihat                              |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **0** | BFF proxy, tipe amplop, fetcher, TanStack Query, ESLint konvensi                                                                                                             | belum ada layar; gerbang hijau                       |
| **1** | `/login`, `/authentication`, `proxy.ts`, `LoadingPage` + SVG huruf, `SessionProvider` + `useMenuAccess`, app shell, bottom tab, "Semua modul" + sheet submenu dari menu tree | bisa masuk dan menavigasi 61 layar yang masih kosong |
| **2** | Wrapper `components/common/`, dibangun berbarengan Fase 3                                                                                                                    | —                                                    |
| **3** | **Daftar Jemaat lengkap**: daftar, wizard 5 langkah, ubah, detail, hapus                                                                                                     | cetakan yang disalin 60 kali                         |
| **4** | Pengaturan: User, Role User                                                                                                                                                  | izin bisa diuji sebagai bukan-admin                  |
| **5** | Replikasi per domain: Kejemaatan sisa → Peribadahan → Pelayanan → Keuangan → Kegiatan → Fasilitas → Inventaris → Pengadaan → Anggaran → SDM → Persetujuan                    |                                                      |
| **6** | Beranda: kartu kas, aksi cepat, agenda hari ini                                                                                                                              |                                                      |

Fase 2 sengaja tidak mendahului Fase 3. Wrapper yang ditulis sebelum ada layar
yang memakainya selalu salah bentuk, dan memperbaikinya sesudah 61 layar
terlanjur memakainya jauh lebih mahal daripada menulisnya belakangan.

Fase 4 didahulukan atas domain lain karena selama hanya ada akun admin,
seluruh percabangan izin di §5 tidak pernah benar-benar dieksekusi — `findTree`
mengembalikan seluruh aksi untuk admin, jadi tombol yang seharusnya
tersembunyi tidak pernah terbukti tersembunyi.

## 12. Risiko & yang belum terjawab

**Beranda belum punya endpoint (D20).** Mockup menampilkan "Kas gabungan Rp
248.560.000", "Masuk / Keluar", dan grafik "Persembahan 6 minggu". Di be-sada,
`/api/v1/report` hanya berisi tujuh laporan jemaat; tidak ada endpoint agregat
keuangan. Angka itu harus dirakit dari beberapa endpoint di FE — lambat dan
boros — atau be-sada menambah satu endpoint. Keputusannya ditunda sampai Fase
6; sampai saat itu Beranda dirender sebagai daftar aksi cepat tanpa angka.

**Bentuk respons di luar `jemaat` belum diperiksa satu per satu.** §3.2 disusun
dari `jemaat`, `auth`, dan `menu`. Kemungkinan besar seragam karena
`sendSuccess` dipakai bersama, tetapi `jemaatController` menulis
`res.status().json()` langsung alih-alih memakainya — jadi keseragaman itu
belum terbukti. Diverifikasi per domain saat domainnya digarap, bukan
diasumsikan sekarang.

**Desktop.** D16 menjanjikan shell yang memisahkan navigasi dari isi layar,
tetapi tata letak desktop itu sendiri belum didesain. Keputusan D1 di
`2026-08-13-sada-pwa-architecture-design.md` (sidebar + breadcrumb persisten)
masih berdiri dan belum direkonsiliasi dengan bottom tab di mockup.

## 13. Verifikasi

Yang membuktikan fondasi ini benar, dan harus dijalankan sebelum Fase 3
dimulai:

1. **Cookie same-origin.** Login di perangkat iOS nyata (bukan simulator),
   tutup aplikasi, buka lagi — sesi masih hidup. Ini yang gagal bila D1
   ditinggalkan.
2. **Aset PWA lolos proxy.** `curl -I` terhadap `/manifest.webmanifest` dan
   `/sw.js` tanpa cookie sesi harus membalas 200 dengan `Content-Type` yang
   benar, bukan 307 ke `/login`. Diotomatiskan di CI.
3. **Daftar kosong bukan error.** Cari kata yang pasti tidak ada di Daftar
   Jemaat; layar menampilkan keadaan kosong, bukan error boundary.
4. **Izin benar-benar menyembunyikan.** Dengan akun non-admin tanpa aksi
   `CREATE` pada `DAFTAR_JEMAAT`, tombol Tambah tidak ada di DOM — bukan
   sekadar tidak terlihat.
5. **Konvensi ditegakkan.** `bun run lint` gagal pada `const hasData = ...`
   dan pada `useState(false)`.
6. **Tidak ada kredensial di Data Cache.** Penjaga di `apiClient` sudah
   melempar bila caching eksplisit digabung header `Authorization`/`Cookie`;
   satu test memastikan penjaga itu tetap hidup setelah BFF ditambahkan.

## 14. Rujukan

- `docs/superpowers/specs/2026-08-13-sada-pwa-architecture-design.md` — lapisan
  PWA; keputusan D1–D12 di sana tetap berlaku.
- `be-sada/src/common/constants/menu.ts` — sumber kebenaran 12 domain / 61
  layar.
- `be-sada/src/modules/menu/menu.service.ts` — bentuk `MenuNode` dan sintesis
  `action` untuk admin.
- `be-sada/src/modules/auth/auth.service.ts:262` — `findUnique` yang
  menggabungkan user dan menu tree.
- `be-sada/src/middleware/authentication.ts` — cookie sesi, bukan Bearer.
- `monorepo-apower-fe/STANDARDS.md` — asal konvensi di §7 dan aturan wrapper di
  §8.
- `fe-gkigraharaya/src/components/Loading/custom.module.css` — keyframes
  animasi huruf.
- `fe-gkigraharaya/src/containers/authentication/Container.tsx` — alur
  `/authentication` yang didesain ulang di §4.
