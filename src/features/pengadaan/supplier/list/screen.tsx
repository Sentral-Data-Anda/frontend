"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { SupplierListContent } from "./list-content";

export const SupplierListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.SUPPLIER);

  return isCanView ? (
    <SupplierListContent />
  ) : (
    <div className="pb-6">
      <PageHeader title="Supplier" backHref={domainHref(MENU.PROCUREMENT)} />
      <EmptyState
        title="Anda tidak memiliki akses ke Supplier"
        description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
      />
    </div>
  );
};
