"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { JadwalPelayanListContent } from "./list-content";

export const JadwalPelayanListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.JADWAL_PELAYAN);

  return isCanView ? (
    <JadwalPelayanListContent />
  ) : (
    <div className="pb-6">
      <PageHeader
        title="Jadwal Pelayan"
        backHref={domainHref(MENU.PELAYANAN)}
      />
      <EmptyState
        title="Anda tidak memiliki akses ke Jadwal Pelayan"
        description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
      />
    </div>
  );
};
