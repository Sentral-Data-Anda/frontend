"use client";

import { ConfirmDialog } from "@/components/common/overlay";
import { useBoolean } from "@/hooks/use-boolean";

export async function logout(): Promise<void> {
  try {
    await fetch("/api/v1/auth/logout", { method: "DELETE" });
  } catch {
  } finally {
    window.location.replace("/login");
  }
}

interface PropTypes {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm?: () => void;
}

export const LogoutDialog = (props: PropTypes) => {
  const { isOpen, onOpenChange, onConfirm } = props;

  const isPending = useBoolean();

  const onLogout = () => {
    onConfirm?.();
    isPending.onTrue();
    void logout();
  };

  // Dialognya sengaja dibiarkan terbuka. `logout` selalu berakhir dengan
  // pindah halaman, jadi tidak ada yang perlu dikembalikan ke pemanggilnya,
  // dan menutupnya lebih dulu hanya menyisakan layar diam tanpa penanda
  // selama permintaannya berjalan. Ketiga pintu keluar memakai dialog ini,
  // sehingga penandanya cukup dipasang di sini sekali.
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Keluar dari akun?"
      description="Anda perlu masuk lagi untuk memakai SADA di perangkat ini."
      confirmLabel={isPending.value ? "Keluar…" : "Keluar"}
      cancelLabel="Batal"
      isDestructive
      isPending={isPending.value}
      isClosedOnConfirm={false}
      onConfirm={onLogout}
    />
  );
};
