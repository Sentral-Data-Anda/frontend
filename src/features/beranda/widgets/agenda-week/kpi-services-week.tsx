"use client";

import { Church } from "lucide-react";

import { KpiCell } from "@/components/common/dashboard";

import { useIbadahRange } from "../../api";
import { weekKeys } from "../../model";

export const KpiServicesWeek = () => {
  const days = weekKeys(new Date());
  const ibadah = useIbadahRange(days[0], days[6]);

  return (
    <KpiCell
      label="Ibadah"
      icon={Church}
      tone="secondary"
      value={`${ibadah.data?.length ?? 0}`}
      hint="minggu ini"
      isLoading={ibadah.isPending}
      isError={ibadah.isError}
    />
  );
};
