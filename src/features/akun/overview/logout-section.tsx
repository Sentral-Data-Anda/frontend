"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/common/control";
import { FormSection, FormWide } from "@/components/common/form";
import { logout } from "@/components/layout";
import { useBoolean } from "@/hooks/use-boolean";

export const LogoutSection = () => {
  const isPending = useBoolean();

  const onLogout = () => {
    isPending.onTrue();
    void logout();
  };

  return (
    <FormSection
      isReadOnly
      legend="Keluar"
      note="Mengakhiri sesi di perangkat ini. Perangkat lain tetap masuk."
    >
      <FormWide>
        <Button
          type="button"
          variant="outline"
          disabled={isPending.value}
          onClick={onLogout}
        >
          <LogOut className="size-4" aria-hidden />
          {isPending.value ? "Keluar…" : "Keluar dari akun"}
        </Button>
      </FormWide>
    </FormSection>
  );
};
