"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/common/control";
import { endActionSize, LogoutDialog } from "@/components/layout";
import { useBoolean } from "@/hooks/use-boolean";
import { cn } from "@/lib/utils";

export const SignOutButton = () => {
  const isConfirmOpen = useBoolean();
  const isPending = useBoolean();

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="lg"
        disabled={isPending.value}
        onClick={isConfirmOpen.onTrue}
        className={cn(
          "text-destructive border-destructive/40 hover:bg-[color-mix(in_oklch,var(--color-destructive)_6%,var(--color-card))] hover:border-destructive/60 hover:text-destructive focus-visible:border-destructive/60 focus-visible:ring-destructive/20 h-11",
          endActionSize,
        )}
      >
        <LogOut className="size-4" aria-hidden />
        {isPending.value ? "Keluar…" : "Keluar dari akun"}
      </Button>

      <LogoutDialog
        isOpen={isConfirmOpen.value}
        onOpenChange={isConfirmOpen.setValue}
        onConfirm={isPending.onTrue}
      />
    </>
  );
};
