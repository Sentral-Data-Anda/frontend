# Desain Arsitektur PWA — Sentral Data Anda (SADA)

**Tanggal:** 2026-08-13
**Status:** Disetujui (siap lanjut ke rencana implementasi)
**Lokasi project:** `fe-sada`
**Menggantikan sebagian:** `2026-06-16-church-profile-architecture-design.md` — repo ini
berubah peran dari company profile menjadi aplikasi SADA. Situs profil gereja menjadi
project terpisah.

---

## 1. Konteks & Ruang Lingkup

SADA adalah **satu aplikasi terautentikasi untuk semua peran** — jemaat maupun
pengurus/sekretariat masuk ke aplikasi yang sama dengan menu berbeda per peran.

Karakter yang menggerakkan seluruh desain di bawah:

- **Dual form-factor.** Bukan aplikasi mobile yang kebetulan bisa dibuka di PC. Jemaat
  dominan memakai HP; pengurus mengerjakan belasan layar CRUD di PC. Keduanya kelas satu.
- **Data terautentikasi.** Isi aplikasi adalah data jemaat. Kebijakan cache adalah
  masalah keamanan, bukan masalah performa.
- **Perangkat bersama.** PC sekretariat dipakai bergantian oleh beberapa orang.
  Kebersihan cache dan subscription saat logout wajib, bukan opsional.

Repo ini saat ini berisi 100% konten situs profil (`(public)/berita`, `galeri`, `tentang`,
`kontak`, plus `sitemap.ts`/`robots.ts` yang dioptimalkan untuk indexing). Semua itu keluar.

**Di luar ruang lingkup dokumen ini:** desain fitur aplikasi (17 layar CRUD), desain auth,
dan sinkronisasi offline dua arah.

---

## 2. Ringkasan Keputusan

| #   | Keputusan                                                        | Alasan singkat                                                             |
| --- | ---------------------------------------------------------------- | -------------------------------------------------------------------------- |
| D0  | Repo ini menjadi aplikasi SADA; konten profil dipindah keluar    | Situs profil jadi project terpisah                                         |
| D1  | App shell persisten (sidebar + breadcrumb) di `(app)/layout.tsx` | Window standalone desktop tidak punya tombol back                          |
| D2  | `robots.ts` dibalik menjadi `Disallow: /`                        | Aplikasi berisi data jemaat, tidak boleh terindeks                         |
| D3  | Service worker ditulis tangan, bukan Serwist                     | Serwist butuh webpack; project ini Turbopack                               |
| D4  | Versi cache distempel lewat query registrasi `?v=BUILD_ID`       | Tanpa build script, aman untuk Turbopack                                   |
| D5  | Tanpa `skipWaiting()` otomatis — update lewat persetujuan user   | Tukar aset di tengah sesi mematikan form yang sedang diisi                 |
| D6  | Handler `fetch` memakai daftar putih, bukan tangkap-semua        | Tangkap-semua akan menyimpan respons API terautentikasi                    |
| D7  | HTML navigasi tidak pernah masuk cache                           | Halaman `(app)/` berisi data jemaat; bertahan melewati logout              |
| D8  | Aset PWA dikecualikan dari proxy lewat `config.matcher`          | Redirect ke `/login` mematikan install & push tanpa error                  |
| D9  | Push dikirim backend Express, bukan Server Action Next           | Sumber event ada di backend; `VAPID_PRIVATE_KEY` tak pernah masuk repo ini |
| D10 | Satu baris subscription per perangkat, kunci alami `endpoint`    | Satu user wajar punya 3 perangkat                                          |
| D11 | Socket **dan** push berjalan bersama, bukan saling menggantikan  | Percabangan lama tidak pernah menjangkau perangkat kedua                   |
| D12 | Window Controls Overlay & `shortcuts` ditunda                    | Polish desktop; targetnya belum ada                                        |

---

## 3. Struktur Route

```
src/app/
  layout.tsx              root — html/body, provider global, export const viewport
  manifest.ts             Web App Manifest (typed)
  apple-icon.png          180x180
  icon.svg
  robots.ts               Disallow: /
  offline/page.tsx        statis, nol data
  (auth)/                 tanpa app shell
    login/
    lupa-password/
  (app)/
    layout.tsx            APP SHELL — sidebar persisten + topbar + breadcrumb
    page.tsx              dashboard
    ...layar CRUD
```

**Dihapus dari repo ini:** `(public)/`, `sitemap.ts` versi SEO, `features/news`,
`features/gallery`, `features/about`.

**Bertahan tapi dirombak:** `features/schedule`. Jadwal pelayan tetap milik SADA, tetapi
service-nya sekarang memakai `next: { revalidate: 300 }`. Pola itu tidak boleh ikut ke data
terautentikasi — satu user melakukan fetch, hasilnya di-cache Next selama 5 menit, dan user
berikutnya menerima data orang lain. **Semua data terautentikasi memakai `cache: "no-store"`
tanpa pengecualian.**

### Kenapa app shell persisten

Konsekuensi langsung dari PWA desktop: window `standalone` tidak menampilkan tombol back
browser. Bila navigasi antar belasan layar CRUD mengandalkan back browser, user desktop
mentok. Sidebar persisten + breadcrumb bukan pilihan estetika — itu satu-satunya jalur
navigasi di mode standalone.

### Kenapa `robots.ts` dibalik

Aplikasi berisi data jemaat. Sekali halaman terautentikasi bocor ke index — misalnya lewat
halaman error yang merender sebagian data — penghapusannya dari index memakan waktu
berminggu-minggu. Default aman: `Disallow: /`.

---

## 4. Manifest & Aset Instalasi

Lokasi `src/app/manifest.ts`, mengembalikan `MetadataRoute.Manifest`, disajikan di
`/manifest.webmanifest`. Next menyuntikkan `<link rel="manifest">` secara otomatis.

**Jangan memakai `cookies()` atau `headers()` di dalamnya.** Dokumentasi Next: `manifest.js`
adalah Route Handler yang _"cached by default unless it uses a Request-time API"_. Begitu
menjadi dinamis, manifest ikut jalur auth dan bisa gagal diambil browser.

### 4.1 Field

| Field                         | Nilai                                  | Alasan                                                                                                                         |
| ----------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `id`                          | `"/"`                                  | Identitas permanen. Berubah = browser menganggapnya aplikasi baru dan semua instalasi lama menjadi yatim. Tidak pernah diubah. |
| `name`                        | `"Sentral Data Anda"`                  | Dialog instalasi                                                                                                               |
| `short_name`                  | `"SADA"`                               | Label ikon; Android memotong sekitar 12 karakter                                                                               |
| `description`                 | diisi                                  | Wajib — tanpa ini dialog instalasi desktop tetap generik meskipun screenshot valid                                             |
| `start_url`                   | `"/"`                                  | Landing yang mengalihkan: sudah login ke dashboard, belum ke `/login`                                                          |
| `scope`                       | `"/"`                                  | URL di luar scope dibuka di browser biasa                                                                                      |
| `display`                     | `"standalone"`                         |                                                                                                                                |
| `display_override`            | `["standalone"]`                       | WCO ditunda, lihat 4.6                                                                                                         |
| `launch_handler`              | `{ client_mode: "navigate-existing" }` | Mencegah window menumpuk dari klik notifikasi                                                                                  |
| `orientation`                 | **dihilangkan**                        | Jangan mengunci portrait; tabel CRUD butuh landscape di tablet                                                                 |
| `background_color`            | sama dengan latar app shell            | Warna splash Android; beda sedikit menimbulkan kedip saat membuka                                                              |
| `theme_color`                 | warna light mode                       | Statis; penanganan dark mode di 4.4                                                                                            |
| `lang` / `dir`                | `"id"` / `"ltr"`                       |                                                                                                                                |
| `prefer_related_applications` | `false`                                | Eksplisit, jangan mengarahkan ke app store                                                                                     |

### 4.2 Ikon

Empat berkas berbeda, bukan satu berkas yang di-resize:

| Berkas                    | Ukuran | `purpose`  | Aturan                                                                                                                     |
| ------------------------- | ------ | ---------- | -------------------------------------------------------------------------------------------------------------------------- |
| `/icons/icon-192.png`     | 192    | `any`      | Dipakai apa adanya; punya latar sendiri                                                                                    |
| `/icons/icon-512.png`     | 512    | `any`      |                                                                                                                            |
| `/icons/maskable-192.png` | 192    | `maskable` | Android memotongnya menjadi lingkaran/squircle. Logo wajib berada di dalam 80% area tengah — minimal padding 10% tiap sisi |
| `/icons/maskable-512.png` | 512    | `maskable` |                                                                                                                            |

**Jangan menulis `purpose: "any maskable"` pada satu berkas.** Sintaksnya sah, tetapi artinya
satu gambar melayani dua peran: Android akan memotongnya, sementara desktop menampilkan versi
ber-padding sehingga logo tampak kekecilan.

Dua aset di luar manifest:

- **`src/app/apple-icon.png`** (180×180) — iOS mengabaikan `icons` manifest untuk home screen.
  Wajib tanpa transparansi dan tanpa sudut membulat; iOS membulatkan sendiri.
- **`/icons/badge-96.png`** (96×96) — badge status bar Android. Harus siluet monokrom di atas
  latar transparan; Android memperlakukannya sebagai mask, sehingga badge berwarna muncul
  sebagai gumpalan solid. Dirujuk dari service worker, bukan dari manifest.

### 4.3 Screenshots (fase 1b)

```
screenshots: [
  { src: "/screenshots/desktop-dashboard.png", sizes: "1440x900", form_factor: "wide",   label: "..." },
  { src: "/screenshots/desktop-jadwal.png",    sizes: "1440x900", form_factor: "wide",   label: "..." },
  { src: "/screenshots/mobile-dashboard.png",  sizes: "720x1280", form_factor: "narrow", label: "..." },
]
```

Chrome mensyaratkan seluruh screenshot `wide` memiliki **rasio aspek sama**; bila berbeda,
Chrome membuang seluruh set dan kembali ke dialog generik. Rasio harus antara 1.0 dan 2.3.

Screenshot dibuat **setelah** app shell ada, karena harus tangkapan layar asli. Manifest
dirilis lebih dulu dengan ikon saja — itu sudah cukup agar aplikasi installable. Jangan
mengisi placeholder; user akan melihat UI palsu di dialog instalasi.

### 4.4 Dark mode

`theme_color` di manifest bersifat statis dan mewarnai titlebar window desktop standalone
serta status bar Android. Agar mengikuti tema, tambahkan di `src/app/layout.tsx`:

```ts
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "..." },
    { media: "(prefers-color-scheme: dark)", color: "..." },
  ],
};
```

Manifest tetap diisi warna light sebagai fallback saat aplikasi belum berjalan (splash screen).

### 4.5 Aset PWA wajib lolos proxy

Setelah `(app)/` dilindungi auth, `src/proxy.ts` harus **mengecualikan** aset PWA lewat
`config.matcher`, bukan lewat percabangan di dalam badan fungsi:

```
matcher: ["/((?!_next/static|_next/image|manifest\\.webmanifest|sw\\.js|icons|screenshots|apple-icon|favicon\\.ico).*)"]
```

Proxy mencocoki semua request termasuk berkas `public/`. Pengecualian lewat `matcher` lebih
tahan salah — tidak bisa terlewat ketika orang menambah cabang logika auth di kemudian hari.

Bila `/manifest.webmanifest` terkena redirect ke `/login`, browser menerima HTML alih-alih
JSON, manifest dianggap tidak valid, dan **tombol install hilang tanpa pesan error apa pun**.
Hal yang sama berlaku untuk `/sw.js`: registrasi gagal diam-diam dan push mati total. Ini bug
tersering pada aplikasi terautentikasi dan tersulit didiagnosis karena tidak ada yang
tercetak di console.

Catatan: di Next 16 konvensi `middleware` sudah diganti menjadi `proxy`. Berkasnya diletakkan
di root project atau di dalam `src` bila project memakainya — sejajar dengan `app`.

### 4.6 Window Controls Overlay — ditunda

WCO (`display_override: ["window-controls-overlay", "standalone"]`) menyerahkan area titlebar
kepada aplikasi, memberi tambahan ruang vertikal yang nyata untuk layar CRUD. Biayanya:
variabel CSS `env(titlebar-area-*)`, region drag `app-region: drag`, dan layout harus tetap
benar ketika WCO tidak aktif — yaitu di semua browser desktop non-Chromium dan di seluruh
mobile. Bug khasnya halus: region drag menelan klik tombol.

Fase 1 mengirim `standalone` saja. WCO menyusul sebagai peningkatan terisolasi setelah shell
stabil. `shortcuts` juga ditunda ke fase 1b karena targetnya baru ada setelah rute `(app)/`
selesai, dan `shortcuts` bersifat statis sehingga tidak bisa sadar-peran — targetnya harus
mengalihkan dengan anggun bila peran tidak punya akses, bukan menampilkan 403 kosong.

---

## 5. Service Worker

### 5.1 Ditulis tangan; penstempelan versi

Serwist tidak dipakai. Dokumentasi Next menyebut Serwist _"currently requires webpack
configuration"_, sedangkan project ini berjalan di Turbopack. Service worker ditulis tangan di
`public/sw.js`: JavaScript polos, tidak di-bundle, dan tidak boleh mengimpor kode aplikasi.

Versi cache distempel di sisi registrasi:

```js
navigator.serviceWorker.register(`/sw.js?v=${BUILD_ID}`, {
  scope: "/",
  updateViaCache: "none",
});
```

Browser membandingkan service worker per-URL, sehingga perubahan query berarti resource
berbeda dan event `install` menyala. Di dalam service worker, versinya dibaca kembali dari
`new URL(self.location).searchParams.get("v")` lalu dipakai sebagai nama cache. Tidak perlu
build script maupun route handler, dan aman untuk Turbopack. `BUILD_ID` berasal dari variabel
env publik yang di-set saat build.

Ini memperbaiki mode kegagalan `CACHE_VERSION = "v1"` yang ditulis keras: konstanta itu tidak
pernah berubah, sehingga cache lama nyangkut selamanya.

### 5.2 Siklus hidup

- `install` — precache **shell saja**: `/offline`, ikon, font. Bukan data.
- `activate` — hapus semua cache yang namanya bukan versi sekarang, lalu `clients.claim()`.
- `skipWaiting()` **tidak** dipanggil otomatis; service worker baru menunggu di `waiting`.

Alur update yang terlihat user:

1. Klien mendeteksi service worker berstatus `installed` sementara
   `navigator.serviceWorker.controller` sudah ada
2. Tampilkan toast "Versi baru tersedia — Muat ulang"
3. User mengklik; klien mengirim `postMessage({ type: "SKIP_WAITING" })`
4. Service worker menjalankan `skipWaiting()`
5. Event `controllerchange` memicu `location.reload()`

**Kenapa tidak otomatis.** Service worker baru mengambil alih di tengah sesi, lalu chunk yang
dimuat lazy berikutnya berasal dari build baru sementara HTML berasal dari build lama. Chunk
404 dan aplikasi mati. Pada aplikasi CRUD dengan form panjang, itu berarti user kehilangan
isian yang belum disimpan.

Satu penjaga wajib: flag boolean sebelum `reload()` di handler `controllerchange`, jika tidak
akan terjadi loop reload.

### 5.3 Kebijakan cache

Handler `fetch` **harus `return` lebih awal** untuk apa pun yang tidak masuk daftar putih.
Jangan pernah memanggil `event.respondWith()` untuk semua request.

| Request                               | Strategi                           | Masuk cache?     |
| ------------------------------------- | ---------------------------------- | ---------------- |
| `method !== "GET"`                    | dilewati total                     | tidak            |
| Lintas-origin                         | dilewati total                     | tidak            |
| Apa pun ke base URL API               | network-only                       | **tidak pernah** |
| Navigasi HTML (`mode === "navigate"`) | network-first, gagal ke `/offline` | tidak            |
| `/_next/static/*`                     | cache-first                        | ya (immutable)   |
| `/icons/*`, font                      | stale-while-revalidate             | ya               |

Tiga syarat sebelum `cache.put()`, ketiganya wajib:

1. `response.ok` — jangan menyimpan 404/500, jika tidak error ikut tersaji saat offline
2. `response.type === "basic"` — respons opaque (status 0) tidak bisa diperiksa isinya dan
   menggelembungkan kuota karena di-padding browser
3. Header respons bukan `Cache-Control: no-store`

**HTML navigasi tidak pernah masuk cache.** Halaman `(app)/` dirender di server dan isinya
data jemaat. Sekali HTML masuk CacheStorage, ia bertahan melewati logout dan dapat dibaca user
berikutnya. PC sekretariat adalah perangkat bersama — ini skenario nyata. Yang di-precache
hanya `/offline`: satu halaman statis tanpa data sama sekali.

### 5.4 Logout wajib membersihkan

Fungsi logout menjalankan, berurutan:

1. Panggil logout server (matikan sesi di sisi server)
2. `caches.keys()` lalu hapus semua cache milik aplikasi
3. `registration.pushManager.getSubscription()` lalu `unsubscribe()`, dan kirim endpoint-nya
   ke server untuk dihapus dari basis data
4. Redirect ke `/login`

Langkah 3 sering terlupa. Tanpanya, orang berikutnya yang login di PC yang sama akan menerima
notifikasi milik user sebelumnya.

### 5.5 Header

`next.config.ts` saat ini tidak memiliki `headers()` sama sekali.

Khusus `/sw.js`:

- `Cache-Control: no-cache, no-store, must-revalidate`
- `Content-Type: application/javascript; charset=utf-8`

Tanpa `no-store`, service worker basi bisa nyangkut dan semua perbaikan berikutnya tidak
pernah sampai ke user.

Global: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
`Referrer-Policy: strict-origin-when-cross-origin`.

### 5.6 Registrasi saat pengembangan

Service worker aktif saat `dev` menimbulkan cache basi yang mengganggu, tetapi mematikannya
total membuatnya tidak bisa diuji. Aturannya: registrasi berjalan bila production **atau**
bila flag env publik eksplisit dinyalakan. Pengujian lokal membutuhkan
`next dev --experimental-https`, karena Push API menolak origin non-HTTPS.

---

## 6. Push Notification

### 6.1 Pengiriman milik backend Express

Contoh di dokumentasi Next mengirim push lewat Server Action. Untuk SADA itu salah tempat:
pemicunya — jadwal pelayan, peminjaman ruangan, agenda & events — hidup di backend Express.
Bila pengiriman berada di Next, Next harus mengetahui setiap event backend.

Konsekuensi yang menguntungkan: **`VAPID_PRIVATE_KEY` tidak pernah masuk repo frontend.**
Frontend hanya membutuhkan `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.

Catatan untuk `src/lib/env.ts`: kunci publik VAPID didaftarkan **tanpa `.default()`**. File itu
saat ini memberi default pada semua variabel, sehingga klaim fail-fast tidak berlaku —
aplikasi menyala dengan konfigurasi salah alih-alih menolak start.

### 6.2 Model data

```
PushSubscription
  id          cuid
  userId      FK -> User, onDelete: Cascade
  endpoint    String @unique     <- kunci alami
  p256dh      String
  auth        String
  userAgent   String?            <- untuk daftar "Perangkat aktif" di setelan
  createdAt   DateTime
  lastUsedAt  DateTime
  @@index([userId])
```

Satu user memiliki banyak baris: PC kantor + PC rumah + HP = 3 baris. Ini kasus normal untuk
aplikasi dual form-factor. Desain lama (`Map` dari `userId` ke satu subscription) menghapus dua
perangkat setiap kali orang login di perangkat ketiga.

`endpoint` unik karena ia memang identitas alami — browser yang sama yang berlangganan ulang
mengembalikan endpoint yang sama.

### 6.3 Kontrak endpoint

- `POST /push/subscriptions` — body `{ endpoint, keys: { p256dh, auth } }`, wajib auth.
  **Upsert berdasarkan `endpoint`**, set `userId` ke user saat ini.
- `DELETE /push/subscriptions` — body `{ endpoint }`. Dipanggil saat logout dan saat user
  mematikan notifikasi.

**Kenapa upsert, bukan create.** PC sekretariat dipakai bergantian. User A logout, user B
login, dan browser mengembalikan endpoint yang sama. Bila create-only, baris lama masih
memegang `userId` A sehingga B menerima notifikasi milik A. Upsert-by-endpoint memindahkan
kepemilikan secara otomatis.

### 6.4 Socket dan push berjalan bersama

Desain lama bercabang: socket bila online, push bila tidak. Itu rusak untuk multi-perangkat —
user membuka PC (socket tersambung) sementara HP ada di kantong. Socket hanya sampai ke PC dan
HP tidak menerima apa pun, padahal orangnya sedang jauh dari PC.

Pembagian yang benar, keduanya berjalan:

- **Socket** — memperbarui UI secara langsung pada klien yang sedang terbuka: hitungan badge,
  daftar yang ter-refresh
- **Push** — notifikasi tingkat OS, dikirim ke **semua** subscription milik user

Soal notifikasi ganda ketika user sedang berada di depan PC: `userVisibleOnly: true` bersifat
wajib — Chrome mencabut subscription yang menerima push tanpa menampilkan notifikasi, sehingga
push tidak boleh ditelan diam-diam. Yang diperbolehkan: di handler `push`, periksa
`clients.matchAll({ type: "window" })`; bila ada klien dengan `visibilityState === "visible"`,
tampilkan versi yang lebih sunyi (`silent: true`, tanpa getar). Tetap patuh spesifikasi.

### 6.5 Isi notifikasi

```js
showNotification(title, {
  body,
  icon: "/icons/icon-192.png",
  badge: "/icons/badge-96.png",
  tag: `jadwal-${id}`, // notifikasi baru MENGGANTI yang lama, tidak menumpuk
  renotify: true, // tetap memberi tanda saat mengganti; membutuhkan tag
  data: { url: `/jadwal/${id}` },
});
```

Tanpa `tag`, satu jadwal yang diubah tiga kali meninggalkan tiga notifikasi bertumpuk.
`data.url` adalah target deep-link, bukan URL situs yang ditulis keras seperti pada contoh
dokumentasi Next.

### 6.6 `notificationclick`

Contoh dokumentasi Next (`clients.openWindow('https://your-website.com')`) membuka window baru
setiap kali diklik; admin yang mengklik lima notifikasi mendapat lima window SADA.

Alur yang benar:

1. `event.notification.close()`
2. Ambil `url` dari `event.notification.data`
3. `clients.matchAll({ type: "window", includeUncontrolled: true })`
4. Bila ada klien se-origin: `client.focus()` lalu `client.navigate(url)`
5. Bila tidak ada: barulah `clients.openWindow(url)`

`launch_handler: { client_mode: "navigate-existing" }` di manifest berperan sebagai lapis kedua
untuk browser yang menanganinya di level OS.

### 6.7 UX izin

Chrome menurunkan situs dengan rasio dismiss tinggi ke _quiet notification UI_ secara permanen:
prompt berubah menjadi ikon kecil di address bar dan tidak mudah dipulihkan. Sekali rusak,
rusak untuk semua user.

Aturannya: minta izin hanya setelah aksi user yang eksplisit. Tempatnya halaman
**Pengaturan → Notifikasi** dengan toggle, ditambah satu ajakan kontekstual setelah user
melihat nilainya — misalnya sesudah pertama kali membuka jadwalnya.

Tiga state ditangani terpisah:

| `Notification.permission` | UI                                                                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `default`                 | Tombol "Aktifkan notifikasi"                                                                                                              |
| `granted`                 | Toggle mati + daftar perangkat aktif                                                                                                      |
| `denied`                  | Tidak bisa diminta ulang lewat JavaScript. Tampilkan instruksi membuka izin di setelan browser — jangan tombol yang diam saja saat diklik |

### 6.8 Jalur khusus iOS

iOS 16.4 ke atas baru mengekspos `PushManager` **setelah** aplikasi dipasang ke Layar Utama.
Sebelum itu `"PushManager" in window` bernilai false, sehingga tombol "Aktifkan" tidak
melakukan apa pun.

Deteksi: perangkat iOS **dan**
`window.matchMedia("(display-mode: standalone)").matches === false`. Tampilkan panduan
"Bagikan → Tambahkan ke Layar Utama". Tombol izin baru muncul setelah aplikasi terpasang.

### 6.9 Menghapus subscription mati

Saat mengirim, `web-push` melempar error dengan `statusCode`. **`404` atau `410 Gone` berarti
subscription mati** — aplikasi dicopot, data browser dibersihkan, atau endpoint dirotasi.
Baris itu wajib dihapus dari basis data saat itu juga.

Tanpa penanganan ini, tabel terisi endpoint mati: setiap notifikasi menjadi makin lambat
karena menunggu timeout berkali-kali, dan penyedia push dapat membatasi laju.

### 6.10 Prasyarat backend

Kondisi `be-gkigraharaya` saat ditinjau: `web-push` tidak terpasang, `NotificationService`
tidak pernah diimpor dari mana pun sehingga menjadi kode mati, tidak ada model subscription di
`schema.prisma`, dan VAPID mailto masih `you@example.com`.

Daftar kerja backend:

1. Pasang `web-push`
2. Tambahkan model `PushSubscription` beserta migrasinya
3. Generate kunci VAPID; ganti mailto placeholder dengan email nyata — penyedia push
   memakainya untuk menghubungi pemilik aplikasi saat ada masalah pengiriman
4. Ganti `Map` in-memory dengan query basis data; `Map` hilang setiap server restart
5. Ganti percabangan socket-ATAU-push menjadi socket-DAN-push
6. Sambungkan ke tiga sumber event: jadwal pelayan, peminjaman ruangan, agenda & events
7. Tangani 404/410 dengan menghapus baris

Ini pekerjaan backend dan berada di luar repo ini, tetapi **fase 2 frontend terblokir sampai
poin 1–3 selesai**.

---

## 7. Struktur Berkas

```
public/
  sw.js
  icons/{icon-192,icon-512,maskable-192,maskable-512,badge-96}.png
  screenshots/                      <- fase 1b

src/
  proxy.ts
  app/
    layout.tsx                      + export const viewport (themeColor light/dark)
    manifest.ts
    apple-icon.png
    icon.svg
    robots.ts
    offline/page.tsx
    (auth)/login/
    (app)/layout.tsx
  features/pwa/
    components/
      service-worker-provider.tsx   registrasi + deteksi update
      update-toast.tsx              "Versi baru tersedia — Muat ulang"
      install-prompt.tsx            sadar-platform (iOS berbeda jalur)
      push-toggle.tsx               tiga state izin
    hooks/
      use-service-worker.ts
      use-install-prompt.ts
      use-push-subscription.ts
    services/push.service.ts        POST/DELETE /push/subscriptions
    lib/
      url-base64-to-uint8-array.ts
      display-mode.ts               deteksi standalone & iOS
    types/push.types.ts
  lib/env.ts                        + NEXT_PUBLIC_VAPID_PUBLIC_KEY, tanpa .default()
next.config.ts                      + headers()
```

---

## 8. Fase Pengerjaan

### Fase 0 — Prasyarat (belum ada PWA sama sekali)

- Hapus `(public)/`, `features/news`, `features/gallery`, `features/about`
- Bangun `(auth)/` dan app shell `(app)/layout.tsx`
- Tentukan bentuk auth
- Tulis `src/proxy.ts` dan `headers()` di `next.config.ts`
- Tambahkan script `typecheck` dan CI yang menjalankan lint serta `tsc --noEmit`

Catatan CI: di Next 16 `next build` **tidak lagi menjalankan lint**. Tanpa CI, konfigurasi
ESLint project ini tidak pernah dijalankan di jalur deploy.

Fase 0 tidak bisa dilompati: cakupan cache service worker ditentukan oleh bentuk auth, dan
subscription push terikat pada identitas user. Membangun PWA sebelum auth ada berarti
membongkarnya ulang kemudian.

### Fase 1 — Installable

- `manifest.ts`, set ikon lengkap, `apple-icon.png`, `viewport.themeColor`
- `sw.js` versi siklus hidup saja: install/activate/versi cache/precache `/offline`/cache-first
  untuk `_next/static`. **Belum ada handler push.**
- `ServiceWorkerProvider`, `UpdateToast`, `InstallPrompt`

### Fase 1b — Setelah shell nyata ada

- Screenshot `wide` dan `narrow` asli
- `shortcuts`

### Fase 2 — Push (terblokir sampai backend menyelesaikan poin 1–3)

- Handler `push` dan `notificationclick` di `sw.js`
- `push.service.ts`, `use-push-subscription`
- Halaman Pengaturan → Notifikasi
- Logout purge: hapus cache dan unsubscribe

### Fase 3 — Offline read-only

Lingkupnya belum ditentukan; akan ditetapkan setelah fase 2 berjalan.

### Fase 4 — Offline tulis + sinkronisasi

Ditunda menunggu riset pengguna: apakah benar ada skenario input lapangan bersinyal buruk.

---

## 9. Verifikasi

Jangan mengandalkan Lighthouse: kategori PWA sudah dihapus sejak Lighthouse v12. Pemeriksaan
di bawah bersifat manual, sebagian dapat diotomatiskan.

### 9.1 Instalasi

- DevTools → Application → Manifest: nol error
- Pasang sungguhan di empat tempat: Chrome desktop, Edge desktop, Chrome Android, Safari iOS
- Dialog instalasi desktop harus menampilkan screenshot. Bila yang muncul dialog generik,
  berarti set `wide` ditolak — biasanya karena rasio aspeknya tidak seragam

### 9.2 Aset lolos proxy (otomatiskan di CI)

```
curl -i https://host/manifest.webmanifest   # 200 + application/manifest+json, BUKAN 302 ke /login
curl -i https://host/sw.js                  # 200 + Cache-Control: no-store
```

Keduanya dijalankan tanpa cookie. Bila salah satu ter-redirect, tombol install hilang dan push
mati tanpa error apa pun di console.

### 9.3 Keamanan cache (checklist manual — pemeriksaan terpenting)

1. Login, buka beberapa halaman yang berisi data jemaat
2. DevTools → Application → Cache Storage → periksa **setiap** entri
3. Harus nol entri yang URL-nya mengarah ke base URL API
4. Harus nol dokumen HTML dari `(app)/`
5. Logout → cache milik aplikasi harus kosong

Satu entri yang lolos berarti data jemaat bertahan di PC bersama setelah logout.

### 9.4 Update service worker

Deploy build A dan pasang, lalu deploy build B dan muat ulang. Yang harus terjadi:

- Toast muncul
- Service worker lama tetap aktif sampai user mengklik
- Setelah klik terjadi satu kali reload, bukan loop
- `caches.keys()` setelah `activate` hanya berisi versi baru

### 9.5 Push

1. Berlangganan di dua perangkat dengan akun sama → **dua baris** di basis data
2. Kirim → keduanya berbunyi
3. Bersihkan data situs di satu perangkat lalu kirim lagi → server menerima 410 dan
   **menghapus baris itu**
4. Logout di perangkat A → baris A hilang, perangkat B masih menerima
5. Klik notifikasi ketika window aplikasi sudah terbuka → window itu fokus dan bernavigasi,
   **tidak** muncul window baru

---

## 10. Rujukan

Seluruh perilaku Next.js di dokumen ini diverifikasi terhadap dokumentasi versi terpasang di
`node_modules/next/dist/docs/`, bukan dari ingatan:

- `01-app/02-guides/progressive-web-apps.md`
- `01-app/03-api-reference/03-file-conventions/01-metadata/manifest.md`
- `01-app/03-api-reference/03-file-conventions/proxy.md`
- `01-app/03-api-reference/04-functions/generate-viewport.md`
- `lib/metadata/types/manifest-types.d.ts` (tipe `MetadataRoute.Manifest`)
