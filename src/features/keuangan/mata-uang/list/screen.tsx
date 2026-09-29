"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { CurrencyListContent } from "./list-content";

export const CurrencyListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.MATA_UANG);

  if (isCanView) return <CurrencyListContent />;

  return (
    <div className="pb-6">
      <PageHeader title="Mata Uang" backHref={domainHref(MENU.KEUANGAN)} />

      <EmptyState
        title="Anda tidak memiliki akses ke Mata Uang"
        description="Hubungi administrator bila Anda memerlukan akses ini."
      />
    </div>
  );
};
