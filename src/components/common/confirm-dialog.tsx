"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";

import { Button } from "@/components/common/button";

/**
 * Konfirmasi untuk aksi yang tidak bisa dibatalkan: membuang isian form, dan
 * kelak menghapus data.
 *
 * `AlertDialog`, bukan `Dialog`: ia tidak bisa ditutup dengan mengetuk di luar
 * panel. Keluar dari form berisi karena salah ketuk adalah persis kehilangan
 * yang mau dicegah dialog ini.
 *
 * Aksi utama di KANAN, sama dengan baris aksi form dan kepala dashboard.
 */
export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Batal",
  isDestructive = false,
  onConfirm,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 min-h-dvh bg-foreground/40 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />

        <AlertDialog.Popup className="bg-card text-card-foreground fixed top-1/2 left-1/2 z-50 flex w-[calc(100vw-2.5rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-xl p-5 shadow-lg transition-[opacity,scale] duration-150 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
          <div className="space-y-1">
            <AlertDialog.Title className="text-title font-semibold">
              {title}
            </AlertDialog.Title>
            <AlertDialog.Description className="text-muted-foreground text-body">
              {description}
            </AlertDialog.Description>
          </div>

          <div className="flex justify-end gap-2">
            <AlertDialog.Close
              render={<Button type="button" variant="outline" />}
            >
              {cancelLabel}
            </AlertDialog.Close>

            <AlertDialog.Close
              render={
                <Button
                  type="button"
                  variant={isDestructive ? "destructive" : "default"}
                />
              }
              onClick={onConfirm}
            >
              {confirmLabel}
            </AlertDialog.Close>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
