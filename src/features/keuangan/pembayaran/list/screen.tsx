"use client";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { NO_VIEW } from "../model";

import { PaymentListContent } from "./list-content";

export const PaymentListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.PAYMENT);

  return isCanView ? (
    <PaymentListContent />
  ) : (
    <div className="pb-6">
      <PageHeader title="Payment" backHref={domainHref(MENU.FINANCE)} />
      <EmptyState
        title="Anda tidak memiliki akses ke Payment"
        description={NO_VIEW}
      />
    </div>
  );
};
