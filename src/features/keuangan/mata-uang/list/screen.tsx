"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { CurrencyListContent } from "./list-content";

export const CurrencyListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.CURRENCY);

  if (isCanView) return <CurrencyListContent />;

  return (
    <div className="pb-6">
      <PageHeader title="Currency" backHref={domainHref(MENU.FINANCE)} />

      <EmptyState
        title="Anda tidak memiliki akses ke Currency"
        description="Hubungi administrator bila Anda memerlukan akses ini."
      />
    </div>
  );
};
