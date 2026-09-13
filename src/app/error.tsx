"use client";

import { useEffect } from "react";

import { Button } from "@/components/common/button";
import { Container } from "@/components/layout/container";

/**
 * Error boundary tingkat root (lihat
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md).
 * Next.js meneruskan dua prop: `error` (berisi `digest` di production) dan
 * `reset`.
 *
 * Di production Next menyamarkan `error.message` asli dari Server Component
 * (mencegah kebocoran detail sensitif — relevan di sini karena isi aplikasi
 * SADA adalah data jemaat) dan hanya menyisakan `error.digest`: hash yang
 * berkorelasi dengan baris log di server. Tanpa mencatat/menampilkan digest,
 * laporan user ("halaman errornya") tidak bisa dilacak balik ke log mana pun.
 *
 * Tombol pemulihan memakai `unstable_retry`, bukan `reset`. Dokumen di atas:
 * "In most cases, you should use unstable_retry() instead. However, if you
 * have a specific reason to clear the error state and re-render the error
 * boundary's children WITHOUT RE-FETCHING the contents, you can use the
 * reset() function." Kelas error yang paling mungkin terjadi di SADA adalah
 * kegagalan `apiClient` di Server Component; `reset` hanya membersihkan state
 * error dan render ulang tanpa mengambil data lagi, jadi setelah backend
 * pulih pun user tetap melihat halaman error. `unstable_retry` (ditambahkan
 * di v16.2.0; versi repo ini 16.2.9) melakukan re-fetch + re-render segmen.
 *
 * Prefiks "unstable_" berarti namanya masih bisa berubah — itu biaya yang
 * jauh lebih kecil daripada tombol pemulihan yang tidak memulihkan apa pun.
 */
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // Aturan lint proyek ini melarang seluruh console.* ("no-console":
    // "error"), jadi console.error(error) tidak bisa dipakai di sini.
    // reportError() adalah primitif platform (bukan console) untuk
    // melaporkan error tak tertangani: ia memicu event `error` global yang
    // bisa didengarkan oleh layanan pemantauan (mis. Sentry) begitu
    // terpasang nanti, tanpa perlu menyentuh berkas ini lagi.
    reportError(error);
  }, [error]);

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-semibold">Terjadi kesalahan</h1>
      <p className="max-w-md text-muted-foreground">
        Maaf, terjadi kendala saat memuat halaman. Silakan coba lagi beberapa
        saat lagi.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground">
          Kode error: <code>{error.digest}</code> — sertakan kode ini bila
          menghubungi pengurus.
        </p>
      )}
      <Button onClick={() => unstable_retry()}>Coba lagi</Button>
    </Container>
  );
}
