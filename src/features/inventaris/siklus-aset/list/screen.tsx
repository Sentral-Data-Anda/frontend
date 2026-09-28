"use client";

import { useSearchParams } from "next/navigation";

import { EmptyState } from "@/components/common/feedback";
import { PageHeader } from "@/components/layout";
import { MENU, domainHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { KIND_PARAM, kindOf } from "../model";

import { DisposalContent } from "./disposal-content";
import { MaintenanceContent } from "./maintenance-content";
import { TransferContent } from "./transfer-content";

const CONTENT = {
  perawatan: MaintenanceContent,
  pindah: TransferContent,
  pelepasan: DisposalContent,
};

export const CycleListScreen = () => {
  const { isCanView } = useMenuAccess(MENU.SIKLUS_ASET);
  const kind = kindOf(useSearchParams().get(KIND_PARAM));
  const Content = CONTENT[kind];

  return isCanView ? (
    <Content />
  ) : (
    <div className="pb-6">
      <PageHeader title="Siklus Aset" backHref={domainHref(MENU.INVENTARIS)} />
      <EmptyState
        title="Anda tidak memiliki akses ke Siklus Aset"
        description="Hubungi administrator bila Anda memang seharusnya memegang akses ini."
      />
    </div>
  );
};
