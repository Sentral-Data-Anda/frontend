"use client";

import { FileChartColumn } from "lucide-react";

import { KpiCell } from "@/components/common/dashboard";
import { formatRupiahCompact } from "@/lib/format";

import { useSurplusDefisit } from "../../api";

import { useRanges } from "./data";

export const KpiSurplusYear = () => {
  const ranges = useRanges();
  const query = useSurplusDefisit(ranges.yearStart, ranges.today);
  const surplus = query.data?.surplus;

  return (
    <KpiCell
      label="Surplus tahun ini"
      icon={FileChartColumn}
      tone="secondary"
      value={
        surplus === undefined
          ? undefined
          : `${surplus > 0 ? "+" : ""}${formatRupiahCompact(surplus)}`
      }
      hint={ranges.untilLabel}
      isLoading={query.isPending}
      isError={query.isError}
    />
  );
};
