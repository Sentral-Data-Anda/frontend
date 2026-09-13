/**
 * Environment DOM untuk `bun test`.
 *
 * Bun berjalan di runtime server: tanpa berkas ini tidak ada `window`,
 * `document`, maupun `navigator`, sehingga apa pun yang menyentuh DOM tidak
 * bisa diuji sama sekali. Itulah kenapa sebelum ini seluruh test di repo ini
 * hanya menguji fungsi murni — komponen dan hook, yang justru paling banyak
 * logika siklus hidupnya, tidak tertest satu pun.
 *
 * Dimuat lewat `[test].preload` di bunfig.toml, jadi berlaku untuk SEMUA
 * berkas test. Konsekuensinya perlu diingat saat menulis test: pemeriksaan
 * seperti `typeof navigator !== "undefined"` sekarang bernilai true di dalam
 * test, sama seperti di browser sungguhan.
 */
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { mock } from "bun:test";

/**
 * happy-dom membawa implementasi HTTP-nya sendiri dan menimpa `fetch` global
 * beserta kelas-kelas terkaitnya. Itu memecahkan test yang menguji
 * `src/lib/api/client.ts`: test-test itu menembak server HTTP lokal
 * sungguhan, dan fetch bawaan happy-dom gagal mem-parse responsnya
 * ("NetworkError: ... Parse Error").
 *
 * Lebih penting dari itu, fetch bawaan happy-dom BUKAN yang dipakai di
 * production. Menguji apiClient terhadapnya berarti menguji tiruan, bukan
 * kode yang benar-benar berjalan — termasuk perilaku `AbortSignal.timeout`
 * dan `keepalive` yang justru menjadi inti berkas itu.
 *
 * `AbortController`/`AbortSignal` ikut dipulihkan karena satu paket dengan
 * fetch: signal bikinan happy-dom tidak dikenali fetch asli, sehingga
 * pembatalan tidak pernah sampai dan lima test timeout/abort di client.test.ts
 * berubah dari menguji sesuatu menjadi selalu lolos-diam.
 *
 * Jadi implementasi asli Bun disimpan lebih dulu, lalu dipasang kembali
 * setelah registrasi. DOM tetap didapat; lapisan jaringannya tetap nyata.
 */
const nativeFetch = globalThis.fetch;
const nativeHeaders = globalThis.Headers;
const nativeRequest = globalThis.Request;
const nativeResponse = globalThis.Response;
const nativeAbortController = globalThis.AbortController;
const nativeAbortSignal = globalThis.AbortSignal;

GlobalRegistrator.register({
  // URL dipatok supaya `location.pathname` punya nilai yang bisa diandalkan;
  // beberapa test menegaskan path yang ikut terkirim dalam laporan error.
  url: "http://localhost:3000/",
});

globalThis.fetch = nativeFetch;
globalThis.Headers = nativeHeaders;
globalThis.Request = nativeRequest;
globalThis.Response = nativeResponse;
globalThis.AbortController = nativeAbortController;
globalThis.AbortSignal = nativeAbortSignal;

/**
 * Mock `@/lib/env` yang dipusatkan — dipindahkan ke sini dari dua berkas
 * test terpisah (`src/app/api/[...path]/route.test.ts` dan
 * `src/features/auth/get-session.test.ts`) yang tadinya masing-masing
 * menyalin ritual ini sendiri-sendiri.
 *
 * KENAPA MOCK INI ADA SAMA SEKALI: `src/lib/env.ts` memvalidasi lalu
 * MEMBEKUKAN `API_BASE_URL`/`NEXT_PUBLIC_SITE_URL` satu kali, persis saat
 * modul itu pertama diimpor. Banyak berkas test menembak server HTTP tiruan
 * di port acak dan mengarahkan `apiClient`/`getSession`/route handler ke
 * situ lewat `process.env.API_BASE_URL` yang diset ulang per berkas. Selama
 * `@/lib/env` YANG ASLI yang dieksekusi, siapa pun berkas test yang PERTAMA
 * menyentuhnya menang dan nilainya beku untuk SISA PROSES `bun test` — bukan
 * cuma untuk berkas itu sendiri, karena modul di-cache lintas berkas dalam
 * satu proses. Berkas test lain yang menyusun server tiruannya sendiri lalu
 * diam-diam menembak port milik berkas pertama tadi, yang sudah di-stop().
 * Ini persis kegagalan yang pernah terjadi: `client.test.ts` gagal dengan
 * `ConnectionRefused` padahal penyebabnya ada di berkas test lain yang tidak
 * disebut sama sekali di pesan errornya — mode kegagalan paling sulit
 * didiagnosis karena petunjuknya menjauhi akar masalah, bukan mendekatinya.
 *
 * Memakai `mock.module` di sini (bukan cuma di berkas yang butuh) adalah
 * pilihan sadar, bukan kebetulan: `mock.module` di Bun 1.3.14 TIDAK BISA
 * benar-benar dibatalkan — `mock.restore()` terbukti tidak mengembalikan
 * modul asli untuk `import()` dinamis di berkas lain. Karena kebocoran itu
 * tidak terhindarkan, cara paling aman untuk mengendalikannya adalah
 * menjadikannya kebocoran YANG DISENGAJA dan SERAGAM, dipasang sekali di
 * preload sebelum berkas test mana pun sempat mengimpor `@/lib/env` yang
 * asli — bukan berharap tiap penulis test mengingat untuk menyalin mock yang
 * sama persis.
 *
 * KENAPA GETTER, BUKAN NILAI BEKU: objek di bawah membaca `process.env`
 * SETIAP properti diakses, bukan menyalin nilainya sekali saat preload ini
 * jalan (yang mana masih terlalu dini — server tiruan tiap berkas test belum
 * tentu sudah punya port saat ini dieksekusi). Dengan getter, urutan berkas
 * mana yang lebih dulu menyetel `process.env.API_BASE_URL` tidak lagi
 * penting: setiap berkas test yang mengarahkan env-nya sendiri lewat
 * `process.env` sebelum memanggil kode yang bergantung padanya akan selalu
 * mendapat nilai yang benar dan terkini, siapa pun yang menyetelnya terakhir.
 *
 * KONSEKUENSI — BACA SEBELUM MENULIS TEST UNTUK `env.ts` SENDIRI: preload
 * ini berarti TIDAK ADA test di seluruh suite yang lagi-lagi mengeksekusi
 * `env.ts` yang asli; setiap `import` ke `@/lib/env`, langsung maupun
 * transitif, selalu mendapat mock ini. Itu artinya validasi fail-fast milik
 * `env.ts` sendiri (mis. "proses gagal start bila API_BASE_URL belum
 * di-set") tidak pernah tersentuh oleh `bun test` sama sekali. Kalau nanti
 * ada yang ingin menguji perilaku itu, test tersebut HARUS berjalan di
 * proses terpisah (mis. lewat `Bun.spawn` menjalankan skrip Node/Bun baru
 * yang mengimpor `@/lib/env` di proses barunya sendiri) — justru KARENA
 * preload ini akan selalu menutupinya bila dijalankan di proses `bun test`
 * yang sama.
 */
mock.module("@/lib/env", () => ({
  env: {
    get API_BASE_URL() {
      return process.env.API_BASE_URL as string;
    },
  },
  publicEnv: {
    get NEXT_PUBLIC_SITE_URL() {
      return process.env.NEXT_PUBLIC_SITE_URL as string;
    },
  },
}));
