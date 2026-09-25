"use client";

import { Button } from "@/components/common/control";

type UpdateToastProps = {
  onApply: () => void;
};

export function UpdateToast({ onApply }: UpdateToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-background fixed inset-x-gutter bottom-4 z-50 mx-auto flex max-w-md flex-wrap items-center justify-between gap-3 rounded-lg border p-3.5 shadow-lg"
    >
      <div>
        <p className="text-body font-medium">Versi baru tersedia</p>
        <p className="text-muted-foreground text-caption">
          Muat ulang untuk memakai versi terbaru.
        </p>
      </div>
      <Button size="sm" onClick={onApply}>
        Muat ulang
      </Button>
    </div>
  );
}
