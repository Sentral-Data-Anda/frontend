"use client";

import { X } from "lucide-react";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/common/control";
import { FormAlert } from "@/components/common/form";
import { useBoolean } from "@/hooks/use-boolean";

import { GAP_NOTE } from "../model";

const STORAGE_KEY = "penyusutan-gap-note-closed";

const subscribe = () => () => {};

const readClosed = () => {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

const writeClosed = () => {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Penyimpanan diblokir: catatan cukup tertutup sampai halaman dimuat ulang.
  }
};

export const GapNote = () => {
  const isStoredClosed = useSyncExternalStore(
    subscribe,
    readClosed,
    () => true,
  );
  const isClosed = useBoolean();

  const onClose = () => {
    writeClosed();
    isClosed.onTrue();
  };

  if (isStoredClosed || isClosed.value) return null;

  return (
    <div className="flex items-start gap-2 px-gutter pb-4">
      <div className="min-w-0 flex-1">
        <FormAlert
          tone="info"
          title={GAP_NOTE.title}
          message={GAP_NOTE.message}
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Tutup catatan"
        className="cursor-pointer"
        onClick={onClose}
      >
        <X aria-hidden />
      </Button>
    </div>
  );
};
