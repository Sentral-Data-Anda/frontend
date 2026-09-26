"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/common/control";
import { logout } from "@/components/layout";
import { useBoolean } from "@/hooks/use-boolean";

export const SignOutButton = () => {
  const isPending = useBoolean();

  const onLogout = () => {
    isPending.onTrue();
    void logout();
  };

  return (
    <Button
      type="button"
      variant="outline"
      disabled={isPending.value}
      onClick={onLogout}
    >
      <LogOut className="size-4" aria-hidden />
      {isPending.value ? "Keluar…" : "Keluar"}
    </Button>
  );
};
