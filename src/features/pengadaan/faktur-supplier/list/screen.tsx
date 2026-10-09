"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { InvoiceListContent } from "./list-content";

export const InvoiceListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.SUPPLIER_INVOICE);

  return isCanView ? (
    <InvoiceListContent />
  ) : (
    <div className="pb-6">
      <PageHeader
        title="Supplier Invoice"
        backHref={domainHref(MENU.PROCUREMENT)}
      />
      <EmptyState
        title="Anda tidak memiliki akses ke Supplier Invoice"
        description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
      />
    </div>
  );
};
