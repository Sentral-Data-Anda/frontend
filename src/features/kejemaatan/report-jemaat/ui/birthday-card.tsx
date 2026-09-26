"use client";

import { SelectField } from "@/components/common/control";
import {
  DashboardCard,
  DashboardTable,
  TableTitle,
  type TableColumn,
} from "@/components/common/dashboard";
import { EmptyState } from "@/components/common/feedback";

import { useBirthdayReport } from "../api";
import { formatDayMonth, MONTH_OPTIONS } from "../model";

const COLUMNS: TableColumn[] = [
  { label: "Nama", width: "2fr" },
  { label: "Tanggal lahir", width: "1fr" },
  { label: "Umur", width: "1fr", align: "right" },
];

interface PropTypes {
  month: number;
  onPickMonth: (month: string) => void;
}

export const BirthdayCard = (props: PropTypes) => {
  const { month, onPickMonth } = props;

  const query = useBirthdayReport(month);
  const monthLabel = MONTH_OPTIONS[month - 1].label;
  const rows = query.data ?? [];

  return (
    <DashboardCard
      title="Ulang tahun"
      query={query}
      minHeight="min-h-32"
      trailing={
        <SelectField
          value={String(month)}
          onValueChange={onPickMonth}
          options={MONTH_OPTIONS}
          aria-label="Bulan ulang tahun"
          className="w-36"
        />
      }
    >
      {rows.length === 0 ? (
        <EmptyState
          isCompact
          title={`Tidak ada anggota yang berulang tahun di bulan ${monthLabel}`}
        />
      ) : (
        <DashboardTable
          label={`Ulang tahun bulan ${monthLabel}`}
          columns={COLUMNS}
          rows={rows.map((row) => ({
            key: `${row.name}-${row.birthDate}`,
            label: row.name,
            cells: [
              <TableTitle key="name" title={row.name} />,
              formatDayMonth(row.birthDate),
              `${row.umur} tahun`,
            ],
            compact: {
              title: row.name,
              meta: formatDayMonth(row.birthDate),
              trailing: `${row.umur} tahun`,
            },
          }))}
        />
      )}
    </DashboardCard>
  );
};
