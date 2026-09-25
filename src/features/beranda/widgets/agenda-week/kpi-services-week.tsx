"use client";

import { KpiCell } from "@/components/common/dashboard";

import { useIbadahRange } from "../../api";
import { weekKeys } from "../../model";

export function KpiServicesWeek() {
  const days = weekKeys(new Date());
  const ibadah = useIbadahRange(days[0], days[6]);

  return (
    <KpiCell
      label="Ibadah · minggu ini"
      value={`${ibadah.data?.length ?? 0}`}
      isLoading={ibadah.isPending}
      isError={ibadah.isError}
    />
  );
}
