"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { RequestListContent } from "./list-content";

export const RequestListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.PERMINTAAN_PEMBELIAN);

  return isCanView ? (
    <RequestListContent />
  ) : (
    <div className="pb-6">
      <PageHeader
        title="Permintaan Pembelian"
        backHref={domainHref(MENU.PENGADAAN)}
      />
      <EmptyState
        title="Anda tidak memiliki akses ke Permintaan Pembelian"
        description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
      />
    </div>
  );
};
