"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { OpnameListContent } from "./list-content";

export const OpnameListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.STOK_OPNAME);

  return isCanView ? (
    <OpnameListContent />
  ) : (
    <div className="pb-6">
      <PageHeader title="Stok Opname" backHref={domainHref(MENU.INVENTORY)} />
      <EmptyState
        title="Anda tidak memiliki akses ke Stok Opname"
        description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
      />
    </div>
  );
};
