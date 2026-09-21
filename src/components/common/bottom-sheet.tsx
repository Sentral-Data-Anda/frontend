"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

/**
 * Sheet yang muncul dari bawah.
 *
 * Dibangun di atas `<dialog>` supaya lapisan atas, `::backdrop`, penutupan
 * dengan Escape, dan pengurungan fokus datang dari browser, bukan dari kode
 * yang harus dijaga sendiri.
 */
export function BottomSheet({
  isOpen,
  title,
  subtitle,
  onClose,
  children,
}: {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Ketukan di luar panel. `<dialog>` menganggap seluruh area termasuk
  // backdrop sebagai dirinya sendiri, jadi yang dibandingkan adalah target
  // ketukan dengan elemen dialog itu sendiri.
  const onBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) onClose();
  };

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    // `showModal` melempar bila dipanggil pada dialog yang sudah terbuka, dan
    // `close` pada yang sudah tertutup memicu event `close` lagi — keduanya
    // dijaga dengan memeriksa `open` lebih dulu.
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      // Escape dan tombol tutup bawaan sama-sama memicu `close`; satu handler
      // di sini membuat state pemanggil ikut menyusul apa pun jalannya.
      onClose={onClose}
      onClick={onBackdropClick}
      className="bg-background text-foreground fixed inset-x-0 bottom-0 top-auto m-0 w-full max-w-none rounded-t-2xl p-0 backdrop:bg-black/40"
    >
      <div
        className="mx-auto mt-3 h-1 w-10 rounded-full bg-border"
        aria-hidden
      />

      <div className="flex items-start gap-3 px-gutter py-4">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-title font-semibold">{title}</h2>
          {subtitle ? (
            <p className="text-muted-foreground truncate text-caption">
              {subtitle}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-full"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="max-h-[60dvh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
        {children}
      </div>
    </dialog>
  );
}
