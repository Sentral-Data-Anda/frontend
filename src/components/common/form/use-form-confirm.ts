"use client";

import { useState, type MouseEvent } from "react";

import { useBoolean } from "@/hooks/use-boolean";

export type ConfirmKind = "save" | "update" | "cancel" | "delete" | "reject";

export const useFormConfirm = () => {
  const [kind, setKind] = useState<ConfirmKind>("save");
  const isOpen = useBoolean();

  const onOpen = (next: ConfirmKind) => {
    setKind(next);
    isOpen.onTrue();
  };

  const onCancel = (isDirty: boolean, onLeave: () => void) => {
    if (isDirty) onOpen("cancel");
    else onLeave();
  };

  const onBack =
    (isDirty: boolean) => (event: MouseEvent<HTMLAnchorElement>) => {
      if (!isDirty) return;

      event.preventDefault();
      onOpen("cancel");
    };

  return {
    kind,
    isOpen: isOpen.value,
    onOpenChange: isOpen.setValue,
    onOpen,
    onCancel,
    onBack,
  };
};

export type FormConfirm = ReturnType<typeof useFormConfirm>;
