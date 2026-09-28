"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { LoanListContent } from "./list-content";

export const LoanListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.PEMINJAMAN_RUANG);

  return isCanView ? (
    <LoanListContent />
  ) : (
    <div className="pb-6">
      <PageHeader
        title="Peminjaman Ruang"
        backHref={domainHref(MENU.FASILITAS)}
      />
      <EmptyState
        title="Anda tidak memiliki akses ke Peminjaman Ruang"
        description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
      />
    </div>
  );
};
