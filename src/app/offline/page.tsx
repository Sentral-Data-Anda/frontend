import type { Metadata } from "next";
import { connection } from "next/server";

import { shellWidth } from "@/components/layout/shell-width";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tidak ada koneksi",
};

export default async function OfflinePage() {
  await connection();

  return (
    <div
      className={cn(
        shellWidth,
        "flex min-h-[60vh] flex-col items-center justify-center gap-4 px-gutter text-center",
      )}
    >
      <h1 className="text-title font-semibold">Tidak ada koneksi</h1>
      <p className="text-muted-foreground max-w-md text-body">
        Halaman ini butuh jaringan dan perangkat Anda sedang offline. Periksa
        koneksi, lalu muat ulang.
      </p>
    </div>
  );
}
