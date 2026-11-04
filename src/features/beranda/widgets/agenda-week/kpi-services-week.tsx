"use client";

import { Church } from "lucide-react";

import { KpiCell } from "@/components/common/dashboard";

import { useWeekDashboard } from "../office/data";

export const KpiServicesWeek = () => {
  const { query } = useWeekDashboard();

  return (
    <KpiCell
      label="Ibadah"
      icon={Church}
      tone="secondary"
      value={`${query.data?.ibadah.length ?? 0}`}
      hint="minggu ini"
      isLoading={query.isPending}
      isError={query.isError}
    />
  );
};
