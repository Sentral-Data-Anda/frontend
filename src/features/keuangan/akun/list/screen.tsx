"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { AccountListContent } from "./list-content";

export const AccountListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.CHART_OF_ACCOUNT);

  if (isCanView) return <AccountListContent />;

  return (
    <div className="pb-6">
      <PageHeader
        title="Chart of Account"
        backHref={domainHref(MENU.FINANCE)}
      />

      <EmptyState
        title="Anda tidak memiliki akses ke Chart of Account"
        description="Hubungi administrator bila Anda memerlukan akses ini."
      />
    </div>
  );
};
