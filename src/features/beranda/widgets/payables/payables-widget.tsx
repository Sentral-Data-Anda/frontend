"use client";

import {
  DashboardCard,
  DashboardTable,
  TableTitle,
  type TableRow,
} from "@/components/common/dashboard";
import { Badge } from "@/components/common/display";
import { EmptyState } from "@/components/common/feedback";
import { MENU, domainHref } from "@/config/menu";
import { formatRupiah, formatRupiahCompact } from "@/lib/format";

import { usePayables } from "./data";

const MAX_ROWS = 6;

const COLUMNS = [
  { label: "Item", width: "2.3fr" },
  { label: "Jenis", width: "1fr", align: "right" as const },
  { label: "Nominal", width: "0.9fr", align: "right" as const },
  { label: "Status", width: "1fr", align: "right" as const },
];

export function PayablesWidget() {
  const state = usePayables();
  const rows = state.rows.slice(0, MAX_ROWS);

  const tableRows: TableRow[] = rows.map((row) => {
    const status = <Badge variant={row.status.tone}>{row.status.label}</Badge>;
    const amount = row.amount === null ? "—" : formatRupiahCompact(row.amount);
    const meta = (
      <>
        <span className="truncate">{row.meta}</span>
        {row.isDummy ? <Badge variant="sample">contoh data</Badge> : null}
      </>
    );
    return {
      key: row.key,
      href: row.href,
      label: row.title,
      cells: [
        <span key="item" className="block min-w-0">
          <TableTitle title={row.title} />
          <span className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-caption">
            {meta}
          </span>
        </span>,
        <span key="kind" className="text-muted-foreground truncate">
          {row.kind}
        </span>,
        <span
          key="amount"
          className="font-semibold"
          title={row.amount === null ? undefined : formatRupiah(row.amount)}
        >
          {amount}
        </span>,
        status,
      ],
      compact: {
        title: row.title,
        meta: (
          <>
            <span className="truncate">{row.kind}</span>
            {status}
          </>
        ),
        trailing: amount,
      },
    };
  });

  return (
    <DashboardCard
      title="Perlu diselesaikan"
      actionLabel={
        state.rows.length > MAX_ROWS
          ? `Semua (${state.rows.length})`
          : "Keuangan"
      }
      actionHref={domainHref(MENU.KEUANGAN)}
      query={state}
      minHeight="min-h-48"
    >
      {rows.length === 0 ? (
        <EmptyState isCompact title="Tidak ada yang perlu diselesaikan" />
      ) : (
        <DashboardTable
          label="Perlu diselesaikan"
          columns={COLUMNS}
          rows={tableRows}
        />
      )}
    </DashboardCard>
  );
}
