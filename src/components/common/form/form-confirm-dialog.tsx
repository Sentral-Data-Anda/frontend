"use client";

import { ConfirmDialog } from "@/components/common/overlay";

import type { ConfirmKind, FormConfirm } from "./use-form-confirm";

const QUESTION: Record<ConfirmKind, (noun: string) => string> = {
  save: (noun) => `Apakah Anda ingin menyimpan data ${noun} ini?`,
  update: (noun) => `Apakah Anda ingin menyimpan perubahan data ${noun} ini?`,
  cancel: () =>
    "Apakah Anda ingin membatalkan? Perubahan yang belum disimpan akan hilang.",
  delete: (noun) => `Apakah Anda ingin menghapus data ${noun} ini?`,
  reject: (noun) => `Apakah Anda ingin menolak ${noun} ini?`,
};

interface PropTypes {
  confirm: FormConfirm;
  noun: string;
  descriptions?: Partial<Record<ConfirmKind, string>>;
  onSave?: () => void;
  onLeave?: () => void;
  onDelete?: () => void;
  onReject?: () => void;
}

export const FormConfirmDialog = (props: PropTypes) => {
  const { confirm, noun, descriptions, onSave, onLeave, onDelete, onReject } =
    props;
  const { kind } = confirm;

  const onYes = () => {
    if (kind === "cancel") onLeave?.();
    else if (kind === "delete") onDelete?.();
    else if (kind === "reject") onReject?.();
    else onSave?.();
  };

  return (
    <ConfirmDialog
      isOpen={confirm.isOpen}
      onOpenChange={confirm.onOpenChange}
      title="Konfirmasi Tindakan"
      description={descriptions?.[kind] ?? QUESTION[kind](noun)}
      confirmLabel="Ya"
      cancelLabel="Tidak"
      isDestructive={kind === "delete" || kind === "reject"}
      isFocusReturnedOnConfirm={false}
      onConfirm={onYes}
    />
  );
};
