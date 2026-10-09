import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { ApprovalStatusBadge } from "@/components/common/display";
import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableColumn,
  type DataTableConfig,
} from "@/components/common/list";
import { MENU, detailHref } from "@/config/menu";
import { formatDateShort } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";
import { formatApprovalAmount } from "@/types/persetujuan";

import {
  PERMINTAAN_LIST_PATH,
  documentTitle,
  stageLabel,
  stagePosition,
  submitterName,
  waitingAge,
} from "../model";
import type { ApprovalListItem, ApprovalView } from "../types";

const detailHrefOf = (item: ApprovalListItem) =>
  detailHref(MENU.APPROVAL, MENU.APPROVAL_REQUEST, item.publicId);

const saveFocus = (item: ApprovalListItem) =>
  saveListFocus(PERMINTAAN_LIST_PATH, item.publicId);

const labelOf = (item: ApprovalListItem) =>
  `Lihat ${documentTitle(item)} (${item.code})`;

const amountOf = (item: ApprovalListItem) =>
  formatApprovalAmount(item.documentType, item.amount);

const positionOf = (item: ApprovalListItem) =>
  item.status === "PENDING"
    ? `Tahap ${stageLabel(item)}`
    : item.completedAt
      ? `Selesai ${formatDateShort(item.completedAt)}`
      : "Selesai";

const decisionBadgeOf = (item: ApprovalListItem) =>
  item.myDecision ? (
    <ApprovalStatusBadge status={item.myDecision.status} />
  ) : null;

const metaOf = (item: ApprovalListItem, view: ApprovalView) => {
  if (view === "riwayat") {
    return [
      submitterName(item),
      amountOf(item),
      item.myDecision ? formatDateShort(item.myDecision.actedAt) : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }

  const stage =
    item.status === "PENDING"
      ? `Tahap ${stagePosition(item)}`
      : positionOf(item);
  const who = view === "pengajuan" ? item.code : submitterName(item);

  return `${who} · ${amountOf(item)} · ${stage}`;
};

interface PropTypes {
  item: ApprovalListItem;
  view: ApprovalView;
}

export const PermintaanListItemRow = (props: PropTypes) => {
  const { item, view } = props;

  return (
    <DataListRow
      id={item.publicId}
      className="hover:bg-card relative transition-colors"
      title={
        <Link
          href={detailHrefOf(item)}
          onClick={() => saveFocus(item)}
          aria-label={labelOf(item)}
          className={TABLE_ROW_LINK}
        >
          {documentTitle(item)}
        </Link>
      }
      meta={metaOf(item, view)}
      trailing={
        view === "menunggu" ? (
          <span className="text-muted-foreground text-caption tabular-nums">
            {waitingAge(item.submittedAt, new Date())}
          </span>
        ) : view === "pengajuan" ? (
          <ApprovalStatusBadge status={item.status} />
        ) : (
          decisionBadgeOf(item)
        )
      }
    />
  );
};

type Column = DataTableColumn<ApprovalListItem>;

const DOCUMENT: Column = {
  key: "document",
  header: "Dokumen",
  width: "minmax(0,2fr)",
  cell: (item) => (
    <span className="block min-w-0">
      <span className="block truncate font-medium" title={documentTitle(item)}>
        {documentTitle(item)}
      </span>
      <span
        className="text-muted-foreground block truncate text-caption"
        title={item.document?.title ?? item.code}
      >
        {item.document?.title ?? item.code}
      </span>
    </span>
  ),
};

const SUBMITTER: Column = {
  key: "submitter",
  header: "Pengaju",
  width: "minmax(0,1.4fr)",
  cell: (item) => (
    <span className="block truncate" title={submitterName(item)}>
      {submitterName(item)}
    </span>
  ),
};

const AMOUNT: Column = {
  key: "amount",
  header: "Nominal",
  width: "minmax(0,1fr)",
  align: "end",
  cell: (item) => (
    <span className="block truncate tabular-nums">{amountOf(item)}</span>
  ),
};

const SUBMITTED: Column = {
  key: "submittedAt",
  header: "Diajukan",
  width: "minmax(0,1fr)",
  isSecondary: true,
  cell: (item) => (
    <span className="text-muted-foreground tabular-nums">
      {formatDateShort(item.submittedAt)}
    </span>
  ),
};

const COLUMNS: Record<ApprovalView, Column[]> = {
  menunggu: [
    DOCUMENT,
    SUBMITTER,
    AMOUNT,
    {
      key: "stage",
      header: "Tahap",
      width: "minmax(0,1.4fr)",
      cell: (item) => (
        <span className="block truncate" title={stageLabel(item)}>
          {stageLabel(item)}
        </span>
      ),
    },
    SUBMITTED,
    {
      key: "age",
      header: "Menunggu",
      width: "minmax(0,0.8fr)",
      cell: (item) => (
        <span className="text-muted-foreground tabular-nums">
          {waitingAge(item.submittedAt, new Date())}
        </span>
      ),
    },
  ],
  pengajuan: [
    DOCUMENT,
    AMOUNT,
    {
      key: "position",
      header: "Posisi",
      width: "minmax(0,1.6fr)",
      cell: (item) => (
        <span className="block truncate" title={positionOf(item)}>
          {positionOf(item)}
        </span>
      ),
    },
    SUBMITTED,
    {
      key: "status",
      header: "Status",
      width: "minmax(0,1fr)",
      cell: (item) => <ApprovalStatusBadge status={item.status} />,
    },
  ],
  riwayat: [
    DOCUMENT,
    SUBMITTER,
    AMOUNT,
    {
      key: "decision",
      header: "Keputusan saya",
      width: "minmax(0,1fr)",
      cell: (item) => decisionBadgeOf(item),
    },
    {
      key: "actedAt",
      header: "Diproses",
      width: "minmax(0,1fr)",
      cell: (item) => (
        <span className="tabular-nums">
          {item.myDecision ? formatDateShort(item.myDecision.actedAt) : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status kini",
      width: "minmax(0,1fr)",
      isSecondary: true,
      cell: (item) => <ApprovalStatusBadge status={item.status} />,
    },
  ],
};

export const permintaanTable = (
  view: ApprovalView,
): DataTableConfig<ApprovalListItem> => ({
  columns: COLUMNS[view],
  getRowHref: detailHrefOf,
  getRowLabel: labelOf,
  onRowOpen: saveFocus,
  rowIcon: <ChevronRight />,
});
