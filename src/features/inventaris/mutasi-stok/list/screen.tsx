"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { MutasiListContent } from "./list-content";

export const MutasiListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.MUTASI_STOK);

  return isCanView ? (
    <MutasiListContent />
  ) : (
    <div className="pb-6">
      <PageHeader title="Mutasi Stok" backHref={domainHref(MENU.INVENTARIS)} />
      <EmptyState
        title="Anda tidak memiliki akses ke Mutasi Stok"
        description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
      />
    </div>
  );
};
