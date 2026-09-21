"use client";

import { Button } from "@/components/ui/button";

type UpdateToastProps = {
  onApply: () => void;
};

/**
 * Pemberitahuan "versi baru tersedia".
 *
 * Sengaja meminta tindakan user alih-alih memuat ulang sendiri: user bisa
 * sedang mengisi form panjang, dan memuat ulang tanpa permisi akan membuang
 * isiannya. Tidak ada tombol tutup — pemberitahuan ini menghilang sendiri
 * begitu update diterapkan, dan menyembunyikannya hanya akan meninggalkan user
 * pada versi lama tanpa jalan kembali.
 */
export function UpdateToast({ onApply }: UpdateToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-background fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md flex-wrap items-center justify-between gap-3 rounded-lg border p-4 shadow-lg"
    >
      <div>
        <p className="text-sm font-medium">Versi baru tersedia</p>
        <p className="text-muted-foreground text-xs">
          Muat ulang untuk memakai versi terbaru.
        </p>
      </div>
      <Button size="sm" onClick={onApply}>
        Muat ulang
      </Button>
    </div>
  );
}
