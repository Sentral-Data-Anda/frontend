"use client";

import { useEffect } from "react";

import { Button } from "@/components/common/control";
import { shellWidth } from "@/components/layout";
import { cn } from "@/lib/utils";

export default function Error({
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
    <div
      className={cn(
        shellWidth,
        "flex min-h-[60vh] flex-col items-center justify-center gap-4 px-gutter text-center",
      )}
    >
      <h1 className="text-title font-semibold">Terjadi kesalahan</h1>
      <p className="max-w-md text-muted-foreground">
        Maaf, terjadi kendala saat memuat halaman. Silakan coba lagi beberapa
        saat lagi.
      </p>
      {error.digest && (
        <p className="text-caption text-muted-foreground">
          Kode error: <code>{error.digest}</code> — sertakan kode ini bila
          menghubungi pengurus.
        </p>
      )}
      <Button onClick={() => unstable_retry()}>Coba lagi</Button>
    </div>
  );
}
