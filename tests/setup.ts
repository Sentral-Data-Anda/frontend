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
 * beserta kelas-kelas terkaitnya. Fetch bawaan happy-dom BUKAN yang dipakai
 * peramban sungguhan, dan gagal mem-parse respons dari server HTTP lokal
 * ("NetworkError: ... Parse Error").
 *
 * `AbortController`/`AbortSignal` ikut dipulihkan karena satu paket dengan
 * fetch: signal bikinan happy-dom tidak dikenali fetch asli, sehingga
 * pembatalan tidak pernah sampai.
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
 * `src/lib/env.ts` memvalidasi `VITE_*` saat modul pertama diimpor. Di
 * `bun test` tidak ada Vite yang mengisinya, jadi modul itu ditiru sekali di
 * sini untuk semua berkas test. `mock.module` di Bun 1.3.14 tidak bisa
 * dibatalkan per berkas, sehingga satu tiruan yang seragam lebih aman daripada
 * salinan di tiap test.
 */
mock.module("@/lib/env", () => ({
  env: {
    get VITE_SITE_URL() {
      return process.env.VITE_SITE_URL ?? "http://localhost:3000";
    },
    get VITE_ENABLE_SW() {
      return process.env.VITE_ENABLE_SW === "1";
    },
  },
}));

/**
 * `MOCK_TODAY=YYYY-MM-DD bun test` menggeser kalender maju/mundur sejumlah
 * hari penuh. Dipakai `bun run test:dates` (lihat package.json) untuk
 * membuktikan suite tidak bergantung pada tanggal hari ini.
 *
 * KENAPA ADA: seluruh seed mock bertanggal RELATIF (`addDays(TODAY, -3)`,
 * `day(-18)`, `lastWeekday(4)`), sementara sebagian test menilainya dengan
 * patokan MUTLAK — bulan berjalan, hari Minggu, tahun 2026. Selama suite
 * hanya dijalankan "hari ini", campuran itu lolos diam-diam dan baru pecah
 * pada tanggal tertentu: 1 Oktober 2026 menjatuhkan 8 test yang hijau sehari
 * sebelumnya, tanpa satu pun commit di antaranya.
 *
 * KENAPA BUKAN `setSystemTime` DARI `bun:test`: fungsi itu MEMBEKUKAN jam —
 * `Date.now()` tidak lagi bertambah (terbukti: delta 0 setelah sleep 120ms).
 * Test yang mengukur waktu berjalan sungguhan (kedaluwarsa step-up di
 * `offering-section.test.tsx` memakai `expireMs: 50` lalu menunggu 80ms)
 * jadi merah karena jamnya, bukan karena tanggalnya. Guard yang melaporkan
 * kegagalan palsu akan dimatikan orang, jadi jamnya harus tetap berdetak:
 * yang digeser hanya HARI, dengan jam-menit-detik dibiarkan apa adanya.
 *
 * Pergeseran dihitung terhadap `todayJakarta()` — zona yang sama yang
 * dipakai seluruh aplikasi — supaya `MOCK_TODAY` berarti persis "hari ini
 * menurut aplikasi", bukan menurut UTC.
 */
const mockToday = process.env.MOCK_TODAY;

if (mockToday) {
  const RealDate = Date;
  const dayOf = (value: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(value);
  const shift =
    RealDate.parse(`${mockToday}T00:00:00Z`) -
    RealDate.parse(`${dayOf(new RealDate())}T00:00:00Z`);

  class ShiftedDate extends RealDate {
    constructor(...args: unknown[]) {
      super(
        ...((args.length === 0 ? [RealDate.now() + shift] : args) as [number]),
      );
    }

    static now() {
      return RealDate.now() + shift;
    }
  }

  globalThis.Date = ShiftedDate as DateConstructor;
}
