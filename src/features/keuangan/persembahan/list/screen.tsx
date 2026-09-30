"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { NO_VIEW } from "../model";

import { PersembahanListContent } from "./list-content";

export const PersembahanListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.PERSEMBAHAN);

  return isCanView ? (
    <PersembahanListContent />
  ) : (
    <div className="pb-6">
      <PageHeader title="Persembahan" backHref={domainHref(MENU.KEUANGAN)} />
      <EmptyState
        title="Anda tidak memiliki akses ke Persembahan"
        description={NO_VIEW}
      />
    </div>
  );
};
