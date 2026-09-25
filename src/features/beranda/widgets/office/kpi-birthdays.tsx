"use client";

import { KpiCell } from "@/components/common/dashboard";

import { useWeekBirthdays } from "./data";

export function KpiBirthdays() {
  const { query } = useWeekBirthdays();

  return (
    <KpiCell
      label="Ulang tahun"
      value={`${query.data.length}`}
      hint="minggu ini"
      isLoading={query.isPending}
      isError={query.error !== null}
    />
  );
}
