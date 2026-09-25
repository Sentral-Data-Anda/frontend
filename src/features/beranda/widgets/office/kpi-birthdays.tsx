"use client";

import { Cake } from "lucide-react";

import { KpiCell } from "@/components/common/dashboard";

import { useWeekBirthdays } from "./data";

export const KpiBirthdays = () => {
  const { query } = useWeekBirthdays();

  return (
    <KpiCell
      label="Ulang tahun"
      icon={Cake}
      tone="warning"
      value={`${query.data.length}`}
      hint="minggu ini"
      isLoading={query.isPending}
      isError={query.error !== null}
    />
  );
};
