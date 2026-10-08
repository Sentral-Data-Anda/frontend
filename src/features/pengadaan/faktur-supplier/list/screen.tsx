"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { InvoiceListContent } from "./list-content";

export const InvoiceListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.FAKTUR_SUPPLIER);

  return isCanView ? (
    <InvoiceListContent />
  ) : (
    <div className="pb-6">
      <PageHeader
        title="Faktur Supplier"
        backHref={domainHref(MENU.PENGADAAN)}
      />
      <EmptyState
        title="Anda tidak memiliki akses ke Faktur Supplier"
        description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
      />
    </div>
  );
};
