import { sendReport, toReport } from "@/features/observability/lib/report";

/**
 * Pemasang penangkap error global di browser.
 *
 * Sebelumnya ini berupa komponen (`<ErrorReporter />`) yang dipasang di root
 * layout. Ada dua masalah dengan bentuk itu, dan keduanya menyerang justru
 * error yang paling parah:
 *
 * 1. Komponen di dalam root layout tidak ada bila root layout-nya sendiri
 *    yang gagal. Error yang menjatuhkan seluruh aplikasi adalah error yang
 *    paling tidak mungkin terlaporkan.
 * 2. Komponen baru memasang listener setelah efeknya berjalan, yaitu setelah
 *    hidrasi. Error yang terjadi SAAT hidrasi lolos sepenuhnya.
 *
 * Karena itu pemanggilnya sekarang `src/instrumentation-client.ts`, yang oleh
 * Next dimuat sebelum aplikasi menjadi interaktif dan berada di luar pohon
 * React (lihat
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation-client.md
 * — dokumen itu menampilkan pola `window.addEventListener("error")` ini
 * sebagai contoh utamanya).
 *
 * Dipisah dari berkas instrumentation supaya bisa diuji: berkas
 * instrumentation dieksekusi Next apa adanya saat diimpor, sedangkan fungsi
 * di sini bisa dipasang dan dilepas sesuka test.
 *
 * @returns fungsi pelepas listener. Dipakai test; di produksi tidak dipanggil.
 */
export function installErrorListeners(target: Window = window): () => void {
  const onError = (event: ErrorEvent) => {
    sendReport(
      toReport(
        "error",
        // `event.error` kosong pada beberapa error lintas-origin; `message`
        // menjadi cadangan supaya laporannya tetap terkirim, meski lebih
        // miskin informasi.
        event.error ?? event.message,
        target.location.pathname,
      ),
    );
  };

  const onRejection = (event: PromiseRejectionEvent) => {
    sendReport(
      toReport("unhandledrejection", event.reason, target.location.pathname),
    );
  };

  target.addEventListener("error", onError);
  target.addEventListener("unhandledrejection", onRejection);

  return () => {
    target.removeEventListener("error", onError);
    target.removeEventListener("unhandledrejection", onRejection);
  };
}
