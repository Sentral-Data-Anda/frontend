"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { IbadahListContent } from "./list-content";

export const IbadahListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.IBADAH);

  return isCanView ? (
    <IbadahListContent />
  ) : (
    <div className="pb-6">
      <PageHeader title="Ibadah" backHref={domainHref(MENU.PERIBADAHAN)} />
      <EmptyState
        title="Anda tidak memiliki akses ke Ibadah"
        description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
      />
    </div>
  );
};
