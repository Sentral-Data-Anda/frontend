"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { ReceiptListContent } from "./list-content";

export const ReceiptListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.GOODS_RECEIPT);

  return isCanView ? (
    <ReceiptListContent />
  ) : (
    <div className="pb-6">
      <PageHeader
        title="Goods Receipt"
        backHref={domainHref(MENU.PROCUREMENT)}
      />
      <EmptyState
        title="Anda tidak memiliki akses ke Goods Receipt"
        description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
      />
    </div>
  );
};
