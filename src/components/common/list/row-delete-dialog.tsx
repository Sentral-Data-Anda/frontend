"use client";

import { ConfirmDialog } from "@/components/common/overlay";

// `null` = dialog tertutup, jadi satu state menyimpan baris dan status buka.
export type RowDeleteTarget = {
  label: string;
};

interface PropTypes {
  target: RowDeleteTarget | null;
  entity: string;
  isPending?: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

// Hidup di layar daftar, bukan di baris: baris ikut hilang dan menelan pesan galatnya.
export const RowDeleteDialog = (props: PropTypes) => {
  const {
    target,
    entity,
    isPending = false,
    errorMessage,
    onCancel,
    onConfirm,
  } = props;

  return (
    <ConfirmDialog
      isOpen={target !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) onCancel();
      }}
      title={`Hapus ${entity} ini?`}
      description={
        target
          ? `${target.label} akan dihapus. Tindakan ini tidak bisa dibatalkan.`
          : ""
      }
      confirmLabel={isPending ? "Menghapus…" : "Hapus"}
      isDestructive
      isPending={isPending}
      // Dialog ditutup oleh pemanggil setelah mutasi berhasil, supaya galat
      // masih sempat terbaca bila penghapusan ditolak server.
      isClosedOnConfirm={false}
      onConfirm={onConfirm}
    >
      {errorMessage ? (
        <p role="alert" className="text-destructive text-caption">
          {errorMessage}
        </p>
      ) : null}
    </ConfirmDialog>
  );
};
