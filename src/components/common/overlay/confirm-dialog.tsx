"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { useRef, type ReactNode } from "react";

import { Button } from "@/components/ui";

interface PropTypes {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string | null;
  isDestructive?: boolean;
  isFocusReturnedOnConfirm?: boolean;
  isPending?: boolean;
  isClosedOnConfirm?: boolean;
  onConfirm: () => void;
  children?: ReactNode;
}

export const ConfirmDialog = (props: PropTypes) => {
  const {
    isOpen,
    onOpenChange,
    title,
    description,
    confirmLabel,
    cancelLabel = "Batal",
    isDestructive = false,
    isFocusReturnedOnConfirm = true,
    isPending = false,
    isClosedOnConfirm = true,
    onConfirm,
    children,
  } = props;
  const isConfirmedRef = useRef(false);

  const onConfirmClick = () => {
    isConfirmedRef.current = true;
    onConfirm();
  };

  // Batal/Escape selalu mengembalikan fokus; sesudah konfirmasi, aksinya yang memindahkan fokus.
  const onFinalFocus = () => {
    const isReturned = isFocusReturnedOnConfirm || !isConfirmedRef.current;

    isConfirmedRef.current = false;

    return isReturned;
  };

  return (
    <AlertDialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 min-h-dvh bg-foreground/40 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />

        <AlertDialog.Popup
          finalFocus={onFinalFocus}
          className="bg-card text-card-foreground fixed top-1/2 left-1/2 z-50 flex w-[calc(100vw-2.5rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-xl p-5 shadow-lg transition-[opacity,scale] duration-150 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0"
        >
          <div className="space-y-1">
            <AlertDialog.Title className="text-title font-semibold">
              {title}
            </AlertDialog.Title>
            <AlertDialog.Description className="text-muted-foreground text-body">
              {description}
            </AlertDialog.Description>
          </div>

          {children}

          <div className="flex justify-end gap-2">
            {cancelLabel === null ? null : (
              <AlertDialog.Close
                disabled={isPending}
                render={<Button type="button" variant="outline" />}
              >
                {cancelLabel}
              </AlertDialog.Close>
            )}

            {isClosedOnConfirm ? (
              <AlertDialog.Close
                disabled={isPending}
                aria-busy={isPending || undefined}
                render={
                  <Button
                    type="button"
                    variant={isDestructive ? "destructive" : "default"}
                  />
                }
                onClick={onConfirmClick}
              >
                {confirmLabel}
              </AlertDialog.Close>
            ) : (
              <Button
                type="button"
                variant={isDestructive ? "destructive" : "default"}
                disabled={isPending}
                aria-busy={isPending || undefined}
                onClick={onConfirmClick}
              >
                {confirmLabel}
              </Button>
            )}
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
};
