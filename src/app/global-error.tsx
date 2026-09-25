"use client";

import { useEffect } from "react";

import "./globals.css";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
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
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-control items-center rounded-control px-3 text-body font-medium"
          >
            Coba lagi
          </button>
        </div>
      </body>
    </html>
  );
}
