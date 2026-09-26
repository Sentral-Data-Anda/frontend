"use client";

import { ConfirmDialog } from "@/components/common/overlay";

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

  const onLogout = () => {
    onConfirm?.();
    void logout();
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Keluar dari akun?"
      description="Anda perlu masuk lagi untuk memakai SADA di perangkat ini."
      confirmLabel="Keluar"
      cancelLabel="Batal"
      isDestructive
      onConfirm={onLogout}
    />
  );
};
