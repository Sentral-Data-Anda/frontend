"use client";

import {
  DashboardCard,
  DashboardTable,
  TableTitle,
  type TableRow,
} from "@/components/common/dashboard";
import { Badge } from "@/components/common/display";
import { EmptyState } from "@/components/common/feedback";
import { MENU, menuHref } from "@/config/menu";
import { formatRupiahCompact } from "@/lib/format";

import { amountOf, useWaitingApprovals, type ApprovalItem } from "../../api";
import { daysSince } from "../../model";

import { DOCUMENT_LABEL } from "./data";

const QUEUE_HREF = menuHref(MENU.PERSETUJUAN, MENU.PERMINTAAN_PERSETUJUAN);

const bapelOf = (item: ApprovalItem) =>
  item.steps.find((step) => step.order === item.currentOrder)?.approverBapel
    ?.name;

const ageOf = (days: number) =>
  days === 0 ? "hari ini" : `${days} hari menunggu`;

export const ApprovalsWidget = () => {
  const query = useWaitingApprovals();
  const items = query.data?.data ?? [];
  const now = new Date();

  const rows: TableRow[] = items.slice(0, 5).map((item) => {
    const kind = DOCUMENT_LABEL[item.documentType] ?? item.documentType;
    const amount = amountOf(item.amount);
    const meta = [bapelOf(item), ageOf(daysSince(item.submittedAt, now))]
      .filter(Boolean)
      .join(" · ");
    const status = <Badge variant="wait">Menunggu</Badge>;

    return {
      key: item.code,
      href: QUEUE_HREF,
      label: `${item.code} · ${kind}`,
      cells: [
        <TableTitle key="item" title={`${item.code} · ${kind}`} meta={meta} />,
        <span key="kind" className="text-muted-foreground truncate">
          {kind}
        </span>,
        <span key="amount" className="font-semibold">
          {amount > 0 ? formatRupiahCompact(amount) : "—"}
        </span>,
        status,
      ],
      compact: {
        title: `${item.code} · ${kind}`,
        meta: (
          <>
            <span className="truncate">{meta}</span>
            {status}
          </>
        ),
        trailing: amount > 0 ? formatRupiahCompact(amount) : undefined,
      },
    };
  });

  return (
    <DashboardCard
      title="Menunggu tindakan saya"
      actionLabel="Buka antrean"
      actionHref={QUEUE_HREF}
      query={query}
      minHeight="min-h-36"
    >
      {rows.length === 0 ? (
        <EmptyState isCompact title="Tidak ada yang menunggu" />
      ) : (
        <DashboardTable
          label="Menunggu tindakan saya"
          columns={[
            { label: "Item", width: "2.3fr" },
            { label: "Jenis", width: "1fr", align: "right" },
            { label: "Nominal", width: "0.9fr", align: "right" },
            { label: "Status", width: "1fr", align: "right" },
          ]}
          rows={rows}
        />
      )}
    </DashboardCard>
  );
};
