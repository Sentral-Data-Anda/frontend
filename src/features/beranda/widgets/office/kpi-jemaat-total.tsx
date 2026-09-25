"use client";

import { KpiCell } from "@/components/common/dashboard";

import { useJemaatStats } from "../../api";

export const KpiJemaatTotal = () => {
  const query = useJemaatStats();

  return (
    <KpiCell
      label="Jumlah jemaat"
      value={query.data?.total.toLocaleString("id-ID")}
      hint={
        query.data
          ? `Anggota ${query.data.member.toLocaleString("id-ID")}`
          : undefined
      }
      isLoading={query.isPending}
      isError={query.isError}
    />
  );
};
