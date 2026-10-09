"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { RequestListContent } from "./list-content";

export const RequestListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.PURCHASE_REQUEST);

  return isCanView ? (
    <RequestListContent />
  ) : (
    <div className="pb-6">
      <PageHeader
        title="Purchase Request"
        backHref={domainHref(MENU.PROCUREMENT)}
      />
      <EmptyState
        title="Anda tidak memiliki akses ke Purchase Request"
        description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
      />
    </div>
  );
};
