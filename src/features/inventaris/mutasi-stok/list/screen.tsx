"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { MutasiListContent } from "./list-content";

export const MutasiListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.STOCK_MOVEMENT);

  return isCanView ? (
    <MutasiListContent />
  ) : (
    <div className="pb-6">
      <PageHeader title="Mutasi Stok" backHref={domainHref(MENU.INVENTORY)} />
      <EmptyState
        title="Anda tidak memiliki akses ke Mutasi Stok"
        description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
      />
    </div>
  );
};
