"use client";

import { useSearchParams } from "next/navigation";

import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";

import { KIND_PARAM, kindOf } from "../model";
import { NoCycleAccess } from "../no-cycle-access";

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

  return isCanView ? <Content /> : <NoCycleAccess />;
};
