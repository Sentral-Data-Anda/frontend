"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/common/control";
import { useBoolean } from "@/hooks/use-boolean";
import { cn } from "@/lib/utils";

export async function logout(): Promise<void> {
  try {
    await fetch("/api/v1/auth/logout", { method: "DELETE" });
  } catch {
  } finally {
    window.location.replace("/login");
  }
}

interface PropTypes {
  className?: string;
}

export const LogoutButton = (props: PropTypes) => {
  const { className } = props;

  const isPending = useBoolean();

  const onLogout = () => {
    isPending.onTrue();
    void logout();
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Keluar"
      disabled={isPending.value}
      onClick={onLogout}
      className={cn(
        "text-sidebar-muted-foreground focus-visible:border-transparent focus-visible:ring-0",
        className,
      )}
    >
      <LogOut className="size-4" aria-hidden />
    </Button>
  );
};
