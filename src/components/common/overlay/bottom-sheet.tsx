"use client";

import { X } from "lucide-react";
import { createContext, useEffect, useState } from "react";

export const SheetPortalContext = createContext<HTMLElement | null>(null);

interface PropTypes {
  id?: string;
  isOpen: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const BottomSheet = (props: PropTypes) => {
  const { id, isOpen, title, subtitle, onClose, children } = props;

  const [dialog, setDialog] = useState<HTMLDialogElement | null>(null);

  const onBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialog) onClose();
  };

  useEffect(() => {
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();

      requestAnimationFrame(() =>
        dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus(),
      );
    }
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen, dialog]);

  return (
    <dialog
      id={id}
      ref={setDialog}
      onClose={onClose}
      onClick={onBackdropClick}
      className="bg-card text-foreground fixed inset-x-0 bottom-0 top-auto m-0 w-full max-w-none rounded-t-2xl p-0 backdrop:bg-black/40"
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
          className="bg-muted hover:bg-border focus-visible:ring-ring flex size-control shrink-0 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="max-h-[60dvh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
        <SheetPortalContext value={dialog}>{children}</SheetPortalContext>
      </div>
    </dialog>
  );
};
