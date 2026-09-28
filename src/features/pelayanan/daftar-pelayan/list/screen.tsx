"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { PelayanList } from "./pelayan-list";

export const DaftarPelayanListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.DAFTAR_PELAYAN);

  if (isCanView) return <PelayanList />;

  return (
    <div className="pb-6">
      <PageHeader
        title="Daftar Pelayan"
        backHref={domainHref(MENU.PELAYANAN)}
      />

      <EmptyState
        title="Anda tidak memiliki akses ke Daftar Pelayan"
        description="Hubungi administrator bila Anda memerlukan akses ini."
      />
    </div>
  );
};
