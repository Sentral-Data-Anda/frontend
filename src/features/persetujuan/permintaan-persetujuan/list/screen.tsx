"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { PermintaanList } from "./permintaan-list";

export const PermintaanListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.APPROVAL_REQUEST);

  if (isCanView) return <PermintaanList />;

  return (
    <div className="pb-6">
      <PageHeader
        title="Approval Request"
        backHref={domainHref(MENU.APPROVAL)}
      />

      <EmptyState
        title="Anda tidak memiliki akses ke Approval Request"
        description="Hubungi administrator bila Anda memerlukan akses ini."
      />
    </div>
  );
};
