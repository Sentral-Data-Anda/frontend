import {
  DescriptionItem,
  DescriptionList,
  OptionalText,
  PANEL_TITLE,
  Panel,
} from "@/components/common/display";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

import { actorName, isDeleteKind, modelLabel, recordLinkOf } from "../model";
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
      </DescriptionList>
    </Panel>
  );
};
