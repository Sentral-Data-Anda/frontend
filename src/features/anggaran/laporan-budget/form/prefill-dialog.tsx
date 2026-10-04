"use client";

import { ConfirmDialog } from "@/components/common/overlay";

import { PREFILL_REFILL_TEXT } from "../model";

interface PropTypes {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
}

export const PrefillDialog = (props: PropTypes) => {
  const { isOpen, onOpenChange, onConfirm } = props;

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Isi ulang dari Kas Keluar"
      description={PREFILL_REFILL_TEXT}
      confirmLabel="Isi ulang"
      cancelLabel="Biarkan"
      onConfirm={onConfirm}
    />
  );
};
