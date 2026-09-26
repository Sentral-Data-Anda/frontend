"use client";

import { UserCheck, UserPlus, Users, VenusAndMars } from "lucide-react";

import { KpiCell, KpiStrip } from "@/components/common/dashboard";

import { useTypeGenderReport } from "../api";
import { formatCount } from "../model";

const genderHint = (row: { L: number; P: number }) =>
  `${formatCount(row.L)} laki-laki, ${formatCount(row.P)} perempuan`;

export const ReportKpi = () => {
  const query = useTypeGenderReport();
  const report = query.data;
  const state = { isLoading: query.isPending, isError: query.isError };

  return (
    <KpiStrip label="Ringkasan jemaat">
      <KpiCell
        label="Jumlah jemaat"
        icon={Users}
        value={report ? formatCount(report.total) : undefined}
        hint="anggota dan simpatisan"
        {...state}
      />
      <KpiCell
        label="Anggota"
        icon={UserCheck}
        tone="success"
        value={report ? formatCount(report.member.ALL) : undefined}
        hint={report ? genderHint(report.member) : "jemaat terdaftar"}
        {...state}
      />
      <KpiCell
        label="Simpatisan"
        icon={UserPlus}
        tone="secondary"
        value={report ? formatCount(report.sympathizer.ALL) : undefined}
        hint={report ? genderHint(report.sympathizer) : "belum menjadi anggota"}
        {...state}
      />
      <KpiCell
        label="Laki-laki / Perempuan"
        icon={VenusAndMars}
        tone="warning"
        value={
          report
            ? `${formatCount(report.male)} / ${formatCount(report.female)}`
            : undefined
        }
        hint="semua jemaat"
        {...state}
      />
    </KpiStrip>
  );
};
