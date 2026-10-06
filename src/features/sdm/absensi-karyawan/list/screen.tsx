"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { TITLE } from "../model";

import { AbsensiListContent } from "./list-content";

export const AbsensiListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.ABSENSI_KARYAWAN);

  if (isCanView) return <AbsensiListContent />;

  return (
    <div className="pb-6">
      <PageHeader title={TITLE} backHref={domainHref(MENU.SDM)} />

      <EmptyState
        title="Anda tidak memiliki akses ke Absensi Karyawan"
        description="Hubungi administrator bila Anda memerlukan akses ini."
      />
    </div>
  );
};
