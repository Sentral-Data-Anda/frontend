"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

interface PropTypes {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const BottomSheet = (props: PropTypes) => {
  const { isOpen, title, subtitle, onClose, children } = props;

  const dialogRef = useRef<HTMLDialogElement>(null);

  const onBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) onClose();
  };

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();

      requestAnimationFrame(() =>
        dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus(),
      );
    }
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
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
        {children}
      </div>
    </dialog>
  );
};
