"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { OrderListContent } from "./list-content";

export const OrderListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.PURCHASE_ORDER);

  return isCanView ? (
    <OrderListContent />
  ) : (
    <div className="pb-6">
      <PageHeader
        title="Purchase Order"
        backHref={domainHref(MENU.PROCUREMENT)}
      />
      <EmptyState
        title="Anda tidak memiliki akses ke Purchase Order"
        description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
      />
    </div>
  );
};
