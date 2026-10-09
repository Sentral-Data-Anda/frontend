"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { BarangListContent } from "./list-content";

export const BarangListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.ASSET_MASTER);

  return isCanView ? (
    <BarangListContent />
  ) : (
    <div className="pb-6">
      <PageHeader
        title="Asset Master"
        backHref={domainHref(MENU.FIXED_ASSET)}
      />
      <EmptyState
        title="Anda tidak memiliki akses ke Asset Master"
        description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
      />
    </div>
  );
};
