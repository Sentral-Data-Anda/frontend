"use client";

import { DashboardCard, ProgressBar } from "@/components/common/dashboard";
import { EmptyState } from "@/components/common/feedback";

import { useIncompleteReport } from "../api";
import { formatCount, formatShare, percentOf } from "../model";
import type { IncompleteReport } from "../types";

const MISSING_ALERT_PERCENT = 10;

const FIELDS: {
  key: Exclude<keyof IncompleteReport, "total">;
  label: string;
}[] = [
  { key: "birthDate", label: "Tanpa tanggal lahir" },
  { key: "lastEducation", label: "Tanpa pendidikan terakhir" },
  { key: "profession", label: "Tanpa pekerjaan" },
];

export const CompletenessCard = () => {
  const query = useIncompleteReport();
  const report = query.data;

  return (
    <DashboardCard
      title="Kelengkapan data"
      query={query}
      minHeight="min-h-32"
      trailing={
        report?.total ? (
          <span className="text-muted-foreground text-body tabular-nums">
            {formatCount(report.total)} jemaat
          </span>
        ) : null
      }
    >
      {!report?.total ? (
        <EmptyState isCompact title="Belum ada data jemaat" />
      ) : (
        <ul aria-label="Kelengkapan data" className="space-y-3.5">
          {FIELDS.map((field) => (
            <li key={field.key}>
              <ProgressBar
                label={field.label}
                value={Math.round(percentOf(report[field.key], report.total))}
                meta={
                  report[field.key] > 0
                    ? formatShare(report[field.key], report.total)
                    : "Lengkap"
                }
                alertAbove={MISSING_ALERT_PERCENT}
              />
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
};
