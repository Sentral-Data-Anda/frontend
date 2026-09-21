"use client";

import { useEffect } from "react";

import "./globals.css";

/**
 * Error boundary terakhir: root layout yang gagal.
 *
 * `src/app/error.tsx` TIDAK menangkap ini. Dari
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md:
 * "error.js wraps loading.js, not-found.js, page.js, and nested layout.js
 * files ... It does NOT wrap the layout.js or template.js above it in the
 * same segment." Tanpa berkas ini, kegagalan root layout jatuh ke halaman 500
 * bawaan Next — tanpa bahasa Indonesia, tanpa digest yang bisa dilaporkan
 * user, dan tanpa apa pun yang mengirimkannya ke /api/observability.
 *
 * Tiga batasan yang dipaksakan konvensi ini, semuanya dari dokumen di atas:
 *
 * 1. Harus merender `<html>` dan `<body>` sendiri — berkas ini MENGGANTIKAN
 *    root layout, bukan bersarang di dalamnya.
 * 2. Wajib Client Component, sehingga `metadata` tidak bisa diekspor. Judul
 *    halaman dipasang lewat komponen `<title>` React.
 * 3. Global styles tidak ikut sendiri; karena itu globals.css diimpor
 *    eksplisit di atas.
 *
 * Sengaja TIDAK memakai komponen bersama (shellWidth, Button). Kalau yang
 * gagal justru salah satu komponen itu, halaman inipun akan gagal — dan
 * jaring terakhir yang ikut jebol tidak menangkap apa pun.
 *
 * Catatan tema: dark mode di repo ini berbasis kelas (`.dark` di globals.css),
 * dan kelas itu dipasang root layout yang sedang gagal. Jadi halaman ini
 * selalu terang. Dokumen Next menyebut hal yang sama, dan untuk saat ini
 * konsisten dengan aplikasinya yang juga belum punya penukar tema.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // Aturan lint proyek melarang seluruh console.*. `reportError` adalah
    // primitif platform yang memicu event `error` global, dan listener yang
    // dipasang src/instrumentation-client.ts menangkapnya lalu mengirimkannya
    // ke /api/observability.
    //
    // Listener itu hidup di luar pohon React dan dimuat sebelum aplikasi
    // interaktif, jadi ia tetap ada meski root layout-nya gagal — itulah
    // sebabnya pelapor error dipindahkan ke sana dari komponen di layout.
    reportError(error);
  }, [error]);

  return (
    <html lang="id">
      <body className="bg-background text-foreground flex min-h-screen items-center justify-center p-6 antialiased">
        <title>Terjadi kesalahan · SADA</title>

        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <h1 className="text-title font-semibold tracking-tight">
            Aplikasi gagal dimuat
          </h1>
          <p className="text-muted-foreground text-body">
            Maaf, terjadi kendala yang membuat aplikasi tidak bisa ditampilkan.
            Silakan coba lagi beberapa saat lagi.
          </p>

          {error.digest ? (
            <p className="text-muted-foreground text-caption">
              Kode error: <code>{error.digest}</code> — sertakan kode ini bila
              menghubungi pengurus.
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => unstable_retry()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-body font-medium"
          >
            Coba lagi
          </button>
        </div>
      </body>
    </html>
  );
}
