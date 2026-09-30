"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { NO_VIEW } from "../model";

import { JournalListContent } from "./list-content";

export const JournalListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.JURNAL);

  return isCanView ? (
    <JournalListContent />
  ) : (
    <div className="pb-6">
      <PageHeader title="Jurnal" backHref={domainHref(MENU.KEUANGAN)} />
      <EmptyState
        title="Anda tidak memiliki akses ke Jurnal"
        description={`${NO_VIEW} Hubungi administrator bila Anda memang seharusnya memegangnya.`}
      />
    </div>
  );
};
