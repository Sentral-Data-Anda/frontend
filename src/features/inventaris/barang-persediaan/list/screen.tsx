"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { StockListContent } from "./list-content";

export const StockListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.BARANG_PERSEDIAAN);

  return isCanView ? (
    <StockListContent />
  ) : (
    <div className="pb-6">
      <PageHeader
        title="Barang Persediaan"
        backHref={domainHref(MENU.INVENTARIS)}
      />
      <EmptyState
        title="Anda tidak memiliki akses ke Barang Persediaan"
        description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
      />
    </div>
  );
};
