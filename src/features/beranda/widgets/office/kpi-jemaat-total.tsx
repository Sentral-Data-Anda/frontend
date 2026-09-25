"use client";

import { Users } from "lucide-react";

import { KpiCell } from "@/components/common/dashboard";

import { useJemaatStats } from "../../api";

export const KpiJemaatTotal = () => {
  const query = useJemaatStats();

  return (
    <KpiCell
      label="Jumlah jemaat"
      icon={Users}
      value={query.data?.total.toLocaleString("id-ID")}
      hint={
        query.data
          ? `${query.data.member.toLocaleString("id-ID")} anggota`
          : "anggota dan simpatisan"
      }
      isLoading={query.isPending}
      isError={query.isError}
    />
  );
};
