"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { NO_VIEW, TITLE } from "../model";

import { ReceiptListContent } from "./list-content";

export const ReceiptListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.KAS_MASUK);

  return isCanView ? (
    <ReceiptListContent />
  ) : (
    <div className="pb-6">
      <PageHeader title={TITLE} backHref={domainHref(MENU.FINANCE)} />
      <EmptyState
        title="Anda tidak memiliki akses ke Kas Masuk"
        description={NO_VIEW}
      />
    </div>
  );
};
