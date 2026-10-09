"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { PeriodListContent } from "./list-content";

export const PeriodListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.FISCAL_PERIOD);

  if (isCanView) return <PeriodListContent />;

  return (
    <div className="pb-6">
      <PageHeader title="Periode Fiskal" backHref={domainHref(MENU.FINANCE)} />

      <EmptyState
        title="Anda tidak memiliki akses ke Periode Fiskal"
        description="Hubungi administrator bila Anda memerlukan akses ini."
      />
    </div>
  );
};
