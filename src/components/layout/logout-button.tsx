"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/common/button";
import { useBoolean } from "@/hooks/use-boolean";
import { cn } from "@/lib/utils";

/**
 * Tanpa konfirmasi. Apa pun hasil `DELETE`, halaman diganti lewat navigasi
 * keras, bukan `router.push`: hanya itu yang membuang cache TanStack Query
 * dan sesi di memori — penting di PC bersama sekretariat. Cookie sudah
 * dihapus oleh route BFF, jadi `/login` tidak lagi mengalihkan balik.
 */
/** Sisa prop diteruskan supaya bisa jadi pemicu tooltip di sidebar ringkas. */
export function LogoutButton({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Button>, "onClick" | "children">) {
  const isPending = useBoolean();

  const onLogout = async () => {
    isPending.onTrue();

    try {
      await fetch("/api/v1/auth/logout", { method: "DELETE" });
    } catch {
      // BFF tak terjangkau (offline): tetap pindah — tidak ada yang lebih
      // berguna yang bisa dilakukan tombol ini tanpa jaringan.
    } finally {
      window.location.replace("/login");
    }
  };

  return (
    <Button
      {...props}
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
}
