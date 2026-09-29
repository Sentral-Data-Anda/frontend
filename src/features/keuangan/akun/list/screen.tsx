"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { AccountListContent } from "./list-content";

export const AccountListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.AKUN);

  if (isCanView) return <AccountListContent />;

  return (
    <div className="pb-6">
      <PageHeader title="Akun" backHref={domainHref(MENU.KEUANGAN)} />

      <EmptyState
        title="Anda tidak memiliki akses ke Akun"
        description="Hubungi administrator bila Anda memerlukan akses ini."
      />
    </div>
  );
};
