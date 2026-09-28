"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { PengumumanListContent } from "./list-content";

export const PengumumanListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.PENGUMUMAN);

  return isCanView ? (
    <PengumumanListContent />
  ) : (
    <div className="pb-6">
      <PageHeader title="Pengumuman" backHref={domainHref(MENU.KEGIATAN)} />
      <EmptyState
        title="Anda tidak memiliki akses ke Pengumuman"
        description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
      />
    </div>
  );
};
