"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { KaryawanListContent } from "./list-content";

export const KaryawanListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.EMPLOYEE);

  if (isCanView) return <KaryawanListContent />;

  return (
    <div className="pb-6">
      <PageHeader title="Karyawan" backHref={domainHref(MENU.HR)} />

      <EmptyState
        title="Anda tidak memiliki akses ke Karyawan"
        description="Hubungi administrator bila Anda memerlukan akses ini."
      />
    </div>
  );
};
