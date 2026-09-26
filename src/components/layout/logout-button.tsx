"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/common/control";
import { useBoolean } from "@/hooks/use-boolean";
import { cn } from "@/lib/utils";

import { LogoutDialog } from "./logout-dialog";

interface PropTypes {
  className?: string;
}

export const LogoutButton = (props: PropTypes) => {
  const { className } = props;

  const isConfirmOpen = useBoolean();
  const isPending = useBoolean();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Keluar"
        disabled={isPending.value}
        onClick={isConfirmOpen.onTrue}
        className={cn(
          "text-sidebar-muted-foreground focus-visible:border-transparent focus-visible:ring-0",
          className,
        )}
      >
        <LogOut className="size-4" aria-hidden />
      </Button>

      <LogoutDialog
        isOpen={isConfirmOpen.value}
        onOpenChange={isConfirmOpen.setValue}
        onConfirm={isPending.onTrue}
      />
    </>
  );
};
