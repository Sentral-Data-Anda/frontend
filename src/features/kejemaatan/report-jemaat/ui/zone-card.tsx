"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";

import {
  DashboardCard,
  DashboardTable,
  type TableColumn,
  type TableRow,
} from "@/components/common/dashboard";
import { EmptyState } from "@/components/common/feedback";
import { MENU, menuHref } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { cn } from "@/lib/utils";

import { formatCount, type ZoneReport, zoneLabel } from "../model";
import type { ZoneRow } from "../types";

const TITLE = "Jemaat per wilayah";

const DAFTAR_JEMAAT_HREF = menuHref(MENU.KEJEMAATAN, MENU.DAFTAR_JEMAAT);

const COLUMNS: TableColumn[] = [
  { label: "Wilayah", width: "2fr" },
  { label: "Anggota", width: "1fr", align: "right" },
  { label: "Simpatisan", width: "1fr", align: "right" },
  { label: "KK", width: "1fr", align: "right" },
];

type Counts = Pick<ZoneRow, "anggota" | "simpatisan" | "keluarga">;

const COUNT_LABELS: [keyof Counts, string][] = [
  ["anggota", "Anggota"],
  ["simpatisan", "Simpatisan"],
  ["keluarga", "KK"],
];

function toTableRow(
  key: string,
  label: string,
  counts: Counts,
  tone: string,
  href?: string,
): TableRow {
  const toned = (content: ReactNode) => <span className={tone}>{content}</span>;

  return {
    key,
    href,
    label: href ? `Lihat jemaat ${label}` : label,
    cells: [
      <span
        key="name"
        className={cn("block truncate font-medium", tone)}
        title={label}
      >
        {label}
      </span>,
      ...COUNT_LABELS.map(([field]) => toned(formatCount(counts[field]))),
    ],
    compact: {
      title: toned(label),
      meta: (
        <span className="flex flex-wrap gap-x-3">
          {COUNT_LABELS.map(([field, fieldLabel]) => (
            <span key={field}>
              {fieldLabel}{" "}
              <span className={cn("text-foreground tabular-nums", tone)}>
                {formatCount(counts[field])}
              </span>
            </span>
          ))}
        </span>
      ),
    },
  };
}

interface PropTypes {
  query: UseQueryResult<ZoneReport>;
}

export const ZoneCard = (props: PropTypes) => {
  const { query } = props;

  const { isCanView: isJemaatListShown } = useMenuAccess(MENU.DAFTAR_JEMAAT);
  const report = query.data;

  return (
    <DashboardCard title={TITLE} query={query} minHeight="min-h-76">
      {!report || report.isEmpty ? (
        <EmptyState isCompact title="Belum ada jemaat berwilayah" />
      ) : (
        <DashboardTable
          label={TITLE}
          columns={COLUMNS}
          rows={[
            ...report.rows.map((row) =>
              row.zoneChurchId === null
                ? toTableRow(
                    "tanpa",
                    zoneLabel(row),
                    row,
                    "text-muted-foreground",
                  )
                : toTableRow(
                    String(row.zoneChurchId),
                    zoneLabel(row),
                    row,
                    "",
                    isJemaatListShown
                      ? `${DAFTAR_JEMAAT_HREF}?wilayah=${row.zoneChurchId}`
                      : undefined,
                  ),
            ),
            toTableRow("total", "Total", report.total, "font-semibold"),
          ]}
        />
      )}
    </DashboardCard>
  );
};
