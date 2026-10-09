"use client";

import {
  DashboardCard,
  DashboardTable,
  TableTitle,
  type TableRow,
} from "@/components/common/dashboard";
import { Badge } from "@/components/common/display";
import { EmptyState } from "@/components/common/feedback";
import { MENU, detailHref, menuHref } from "@/config/menu";
import { daysSince } from "@/lib/date";
import {
  APPROVAL_DOCUMENT_LABEL,
  formatApprovalAmount,
} from "@/types/persetujuan";

import { amountOf, useWaitingApprovals, type ApprovalItem } from "../../api";

const QUEUE_HREF = menuHref(MENU.APPROVAL, MENU.APPROVAL_REQUEST);

const detailHrefOf = (item: ApprovalItem) =>
  detailHref(MENU.APPROVAL, MENU.APPROVAL_REQUEST, item.publicId);

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
    const kind = APPROVAL_DOCUMENT_LABEL[item.documentType];
    const amount =
      amountOf(item.amount) > 0
        ? formatApprovalAmount(item.documentType, item.amount)
        : null;
    const meta = [bapelOf(item), ageOf(daysSince(item.submittedAt, now))]
      .filter(Boolean)
      .join(" · ");
    const status = <Badge variant="wait">Menunggu</Badge>;

    return {
      key: item.code,
      href: detailHrefOf(item),
      label: `${item.code} · ${kind}`,
      cells: [
        <TableTitle key="item" title={`${item.code} · ${kind}`} meta={meta} />,
        <span key="kind" className="text-muted-foreground truncate">
          {kind}
        </span>,
        <span key="amount" className="font-semibold">
          {amount ?? "—"}
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
        trailing: amount ?? undefined,
      },
    };
  });

  return (
    <DashboardCard
      title="Persetujuan Saya"
      actionLabel="Semua"
      actionHref={QUEUE_HREF}
      query={query}
      minHeight="min-h-56"
    >
      {rows.length === 0 ? (
        <EmptyState isCompact title="Tidak ada yang menunggu" />
      ) : (
        <DashboardTable
          label="Persetujuan Saya"
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
