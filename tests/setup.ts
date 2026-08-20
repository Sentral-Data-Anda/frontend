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
