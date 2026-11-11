import {
  DETAIL_LINK,
  DescriptionItem,
  DescriptionList,
  OptionalText,
  PANEL_TITLE,
  Panel,
} from "@/components/common/display";
import { AppLink } from "@/components/common/link";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

import {
  actorName,
  isDeleteKind,
  modelLabel,
  recordLinkOf,
  requestLogHref,
} from "../model";
import type { ActionKind, ActivityLog } from "../types";
import { ActionBadge } from "../ui/action-badge";

import { RecordLink } from "./record-link";

interface PropTypes {
  log: ActivityLog;
  kind: ActionKind;
}

export const SummaryPanel = (props: PropTypes) => {
  const { log, kind } = props;

  const link = isDeleteKind(kind) ? null : recordLinkOf(log);
  const label = modelLabel(log.model);
  const endpoint = log.method && log.path ? `${log.method} ${log.path}` : null;

  return (
    <Panel label="Ringkasan">
      <h2 className={cn(PANEL_TITLE, "px-gutter pt-4")}>Ringkasan</h2>

      <DescriptionList className="px-gutter pb-2">
        <DescriptionItem label="Waktu">
          {formatDateTime(log.createdAt)}
        </DescriptionItem>
        <DescriptionItem label="Pengguna">
          <OptionalText text={actorName(log.user)} empty="Tidak diketahui" />
        </DescriptionItem>
        <DescriptionItem label="Aksi">
          <ActionBadge kind={kind} />
        </DescriptionItem>
        <DescriptionItem label="Data">
          {link ? (
            <RecordLink menu={link.menu} href={link.href}>
              {label}
            </RecordLink>
          ) : (
            label
          )}
        </DescriptionItem>
        <DescriptionItem label="ID rekaman">
          <OptionalText text={log.recordId} empty="Tanpa ID" />
        </DescriptionItem>
        <DescriptionItem label="Alamat IP">
          <span className="font-mono">
            <OptionalText text={log.ipAddress} empty="Tidak tercatat" />
          </span>
        </DescriptionItem>
        <DescriptionItem label="Perangkat">
          <OptionalText text={log.userAgent} empty="Tidak tercatat" />
        </DescriptionItem>
        <DescriptionItem label="Endpoint">
          <span className="font-mono">
            <OptionalText text={endpoint} empty="Di luar permintaan" />
          </span>
        </DescriptionItem>
        <DescriptionItem label="ID permintaan">
          {log.requestId ? (
            <AppLink
              href={requestLogHref(log.requestId)}
              className={cn(DETAIL_LINK, "font-mono break-all")}
              aria-label={`Semua catatan dari permintaan ${log.requestId}`}
            >
              {log.requestId}
            </AppLink>
          ) : (
            <OptionalText text={null} empty="Tidak tercatat" />
          )}
        </DescriptionItem>
      </DescriptionList>
    </Panel>
  );
};
