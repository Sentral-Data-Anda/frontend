import type { Instrumentation } from "next";

import { log } from "@/lib/observability/logger";
import {
  redactError,
  redactHeaders,
  redactPath,
} from "@/lib/observability/redact";

/**
 * Penangkap error sisi server.
 *
 * Next memanggil `onRequestError` untuk setiap error yang ditangkapnya saat
 * merender Server Component, menjalankan Route Handler, atau mengeksekusi
 * Server Action.
 *
 * `error.digest` adalah bagian yang membuat ini berguna. Di production Next
 * menyamarkan pesan error asli dari user — perlu, karena isinya bisa memuat
 * data jemaat — dan hanya menyisakan digest. Digest yang sama ditampilkan di
 * halaman error (src/app/error.tsx). Jadi ketika seorang pengurus melapor
 * "muncul kode error 1a2b3c", digest itulah yang mempertemukan laporannya
 * dengan baris log ini. Tanpa mencatat digest, error production tidak bisa
 * dilacak sama sekali.
 *
 * Catatan dari dokumentasi Next: instance error di sini belum tentu error
 * aslinya, karena React bisa memprosesnya lebih dulu saat render Server
 * Component. Digest tetap penanda yang benar.
 */
export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context,
) => {
  log.error("server_error", {
    ...redactError(error),
    request: {
      method: request.method,
      path: redactPath(request.path),
      headers: redactHeaders(request.headers),
    },
    context: {
      routePath: context.routePath,
      routeType: context.routeType,
      renderSource: context.renderSource,
      revalidateReason: context.revalidateReason,
    },
  });
};
