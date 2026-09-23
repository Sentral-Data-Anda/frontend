/**
 * Instrumentasi sisi client.
 *
 * Next memuat berkas ini SEBELUM aplikasi menjadi interaktif (lihat
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation-client.md).
 * Itu yang membuatnya tempat yang benar untuk penangkap error global: error
 * saat hidrasi maupun error yang menjatuhkan root layout tetap tertangkap,
 * dua hal yang tidak bisa dilakukan komponen di dalam pohon React.
 *
 * Pasangan sisi server-nya `src/instrumentation.ts` (`onRequestError`).
 * Keduanya bermuara ke format log yang sama, dan `digest` menjadi
 * penghubung antara laporan dari browser dan baris log di server.
 *
 * Blok try/catch mengikuti anjuran dokumen: kegagalan di kode instrumentasi
 * tidak boleh ikut menjatuhkan aplikasi yang seharusnya ia pantau.
 */
import { installErrorListeners } from "@/features/observability/install-listeners";

try {
  installErrorListeners();
} catch {
  // Sengaja senyap. Pemantauan yang gagal jauh lebih baik daripada
  // pemantauan yang menjatuhkan aplikasi.
}
