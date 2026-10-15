"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { ReturnListContent } from "./list-content";

export const ReturnListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.PURCHASE_RETURN);

  return isCanView ? (
    <ReturnListContent />
  ) : (
    <div className="pb-6">
      <PageHeader
        title="Purchase Return"
        backHref={domainHref(MENU.PROCUREMENT)}
      />
      <EmptyState
        title="Anda tidak memiliki akses ke Purchase Return"
        description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
      />
    </div>
  );
};
