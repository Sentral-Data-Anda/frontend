import { Users } from "lucide-react";

import { KpiCell } from "@/components/common/dashboard";

import { useWeekDashboard } from "./data";

export const KpiJemaatTotal = () => {
  const { query } = useWeekDashboard();

  return (
    <KpiCell
      label="Jumlah jemaat"
      icon={Users}
      value={query.data?.jemaat.total.toLocaleString("id-ID")}
      hint={
        query.data
          ? `${query.data.jemaat.member.toLocaleString("id-ID")} anggota`
          : "anggota dan simpatisan"
      }
      isLoading={query.isPending}
      isError={query.isError}
    />
  );
};
