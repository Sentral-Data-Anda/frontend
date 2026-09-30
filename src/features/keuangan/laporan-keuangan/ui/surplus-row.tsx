"use client";

import { DashboardCard } from "@/components/common/dashboard";
import { cn } from "@/lib/utils";

import { SURPLUS_LABEL, money } from "../model";
import type { ReportQuery } from "../types";

interface PropTypes {
  total: string | undefined;
  hint: string;
  query: ReportQuery;
}

export const SurplusRow = (props: PropTypes) => {
  const { total, hint, query } = props;

  const value = Number(total ?? 0);

  return (
    <DashboardCard title={SURPLUS_LABEL} query={query} minHeight="min-h-12">
      <p
        className={cn(
          "text-kpi font-semibold tracking-tight tabular-nums",
          value < 0 ? "text-destructive" : "text-success",
        )}
      >
        {money(total)}
      </p>

      <p className="text-muted-foreground mt-1 text-caption">{hint}</p>
    </DashboardCard>
  );
};
