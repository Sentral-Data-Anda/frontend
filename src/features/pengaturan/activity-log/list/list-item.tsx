import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { OptionalText } from "@/components/common/display";
import {
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableConfig,
} from "@/components/common/list";
import { MENU, detailHref } from "@/config/menu";
import { formatDateTime } from "@/lib/format";
import { saveListFocus } from "@/lib/list-return";

import {
  ACTIVITY_LOG_LIST_PATH,
  actorName,
  logTitle,
  modelLabel,
} from "../model";
import type { ActivityLogListItem } from "../types";
import { ActionBadge } from "../ui/action-badge";

const keyOf = (log: ActivityLogListItem) => String(log.id);

const detailHrefOf = (log: ActivityLogListItem) =>
  detailHref(MENU.PENGATURAN, MENU.ACTIVITY_LOG, keyOf(log));

const saveFocus = (log: ActivityLogListItem) =>
  saveListFocus(ACTIVITY_LOG_LIST_PATH, keyOf(log));

const labelOf = (log: ActivityLogListItem) =>
  `Lihat ${logTitle(log.kind, log.model)}${log.recordId ? ` #${log.recordId}` : ""}`;

interface PropTypes {
  log: ActivityLogListItem;
}

export const ActivityLogListItemRow = (props: PropTypes) => {
  const { log } = props;

  return (
    <DataListRow
      id={keyOf(log)}
      className="hover:bg-card relative transition-colors"
      title={
        <Link
          href={detailHrefOf(log)}
          onClick={() => saveFocus(log)}
          aria-label={labelOf(log)}
          className={TABLE_ROW_LINK}
        >
          {logTitle(log.kind, log.model)}
        </Link>
      }
      meta={`${actorName(log.user)} · ${formatDateTime(log.createdAt)}`}
      trailing={
        log.recordId ? (
          <span className="text-muted-foreground text-caption tabular-nums">
            #{log.recordId}
          </span>
        ) : null
      }
    />
  );
};

export const activityLogTable: DataTableConfig<ActivityLogListItem> = {
  columns: [
    {
      key: "createdAt",
      header: "Waktu",
      width: "minmax(0,1fr)",
      narrowWidth: "minmax(0,1.2fr)",
      cell: (log) => (
        <span className="block truncate tabular-nums">
          {formatDateTime(log.createdAt)}
        </span>
      ),
    },
    {
      key: "user",
      header: "Pengguna",
      width: "minmax(0,1.5fr)",
      narrowWidth: "minmax(0,1.2fr)",
      cell: (log) => (
        <OptionalText text={actorName(log.user)} empty="Tanpa nama" />
      ),
    },
    {
      key: "action",
      header: "Aksi",
      width: "minmax(0,1fr)",
      narrowWidth: "minmax(0,0.9fr)",
      cell: (log) => <ActionBadge kind={log.kind} />,
    },
    {
      key: "model",
      header: "Data",
      width: "minmax(0,1.5fr)",
      narrowWidth: "minmax(0,1.2fr)",
      cell: (log) => (
        <OptionalText text={modelLabel(log.model)} empty="Tanpa data" />
      ),
    },
    {
      key: "recordId",
      header: "ID",
      width: "minmax(0,0.75fr)",
      isSecondary: true,
      cell: (log) => (
        <span className="text-muted-foreground tabular-nums">
          <OptionalText text={log.recordId} empty="Tanpa ID" />
        </span>
      ),
    },
  ],
  getRowHref: detailHrefOf,
  getRowLabel: labelOf,
  onRowOpen: saveFocus,
  rowIcon: <ChevronRight />,
};
