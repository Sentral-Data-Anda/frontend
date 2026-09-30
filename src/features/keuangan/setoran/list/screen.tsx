"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { TransferListContent } from "./list-content";

export const TransferListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.SETORAN);

  return isCanView ? (
    <TransferListContent />
  ) : (
    <div className="pb-6">
      <PageHeader title="Setoran" backHref={domainHref(MENU.KEUANGAN)} />
      <EmptyState
        title="Anda tidak memiliki akses ke Setoran"
        description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
      />
    </div>
  );
};
