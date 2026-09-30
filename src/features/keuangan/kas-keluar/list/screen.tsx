"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { NO_VIEW } from "../model";

import { ExpenseListContent } from "./list-content";

export const ExpenseListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.KAS_KELUAR);

  return isCanView ? (
    <ExpenseListContent />
  ) : (
    <div className="pb-6">
      <PageHeader title="Kas Keluar" backHref={domainHref(MENU.KEUANGAN)} />
      <EmptyState
        title="Anda tidak memiliki akses ke Kas Keluar"
        description={NO_VIEW}
      />
    </div>
  );
};
