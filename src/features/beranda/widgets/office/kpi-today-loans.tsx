"use client";

import { CalendarClock } from "lucide-react";

import { KpiCell } from "@/components/common/dashboard";

import { useUpcomingLoans } from "./data";

export const KpiTodayLoans = () => {
  const { today, query } = useUpcomingLoans();
  const items = query.data ?? [];

  return (
    <KpiCell
      label="Peminjaman hari ini"
      icon={CalendarClock}
      tone="secondary"
      value={`${items.filter((item) => item.date.slice(0, 10) === today).length}`}
      hint={`${items.length} dalam 7 hari`}
      isLoading={query.isPending}
      isError={query.isError}
    />
  );
};
