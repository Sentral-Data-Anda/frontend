"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { ReceiptListContent } from "./list-content";

export const ReceiptListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.PENERIMAAN_BARANG);

  return isCanView ? (
    <ReceiptListContent />
  ) : (
    <div className="pb-6">
      <PageHeader
        title="Penerimaan Barang"
        backHref={domainHref(MENU.PENGADAAN)}
      />
      <EmptyState
        title="Anda tidak memiliki akses ke Penerimaan Barang"
        description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
      />
    </div>
  );
};
