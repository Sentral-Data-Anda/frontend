import {
  DescriptionItem,
  DescriptionList,
  OptionalText,
  PANEL_TITLE,
  Panel,
} from "@/components/common/display";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  APPROVAL_DOCUMENT_LABEL,
  formatApprovalAmount,
} from "@/types/persetujuan";

import { submitterName } from "../model";
import type { ApprovalRequest } from "../types";
import { ApprovalStatusBadge } from "../ui/approval-status-badge";

interface PropTypes {
  request: ApprovalRequest;
}

export const SummaryPanel = (props: PropTypes) => {
  const { request } = props;

  const { document } = request;

  return (
    <Panel label="Ringkasan">
      <h2 className={cn(PANEL_TITLE, "px-gutter pt-4")}>Ringkasan</h2>

      <DescriptionList className="px-gutter pb-2">
        <DescriptionItem label="Status">
          <ApprovalStatusBadge status={request.status} />
        </DescriptionItem>
        <DescriptionItem label="Jenis dokumen">
          {APPROVAL_DOCUMENT_LABEL[request.documentType]}
        </DescriptionItem>
        <DescriptionItem label="Dokumen" isWide isStacked>
          {document ? (
            `${document.code} — ${document.title}`
          ) : (
            <OptionalText text={null} empty="Dokumen sudah tidak ada" />
          )}
        </DescriptionItem>
        <DescriptionItem label="Nominal">
          <span className="tabular-nums">
            {formatApprovalAmount(request.documentType, request.amount)}
          </span>
        </DescriptionItem>
        <DescriptionItem label="Pengaju">
          {submitterName(request)}
        </DescriptionItem>
        <DescriptionItem label="Diajukan">
          {formatDateTime(request.submittedAt)}
        </DescriptionItem>
        <DescriptionItem label="Alur">
          <OptionalText
            text={request.config?.name}
            empty="Alur sudah tidak ada"
          />
        </DescriptionItem>
        {request.completedAt ? (
          <DescriptionItem label="Selesai">
            {formatDateTime(request.completedAt)}
          </DescriptionItem>
        ) : null}
      </DescriptionList>
    </Panel>
  );
};
