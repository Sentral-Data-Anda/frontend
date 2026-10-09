"use client";

import Link from "next/link";

import {
  ApprovalStatusBadge,
  DescriptionItem,
  DescriptionList,
  DETAIL_LINK as LINK,
  OptionalText,
  Panel,
  PANEL_TITLE,
} from "@/components/common/display";
import { MENU } from "@/config/menu";
import { useMenuAccess } from "@/features/auth";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  APPROVAL_DOCUMENT_LABEL,
  APPROVAL_DOCUMENT_MENU,
  approvalDocumentHref,
  formatApprovalAmount,
} from "@/types/persetujuan";

import { submitterName } from "../model";
import type { ApprovalRequest } from "../types";

interface PropTypes {
  request: ApprovalRequest;
}

export const SummaryPanel = (props: PropTypes) => {
  const { request } = props;

  const { document } = request;
  const documentMenu = APPROVAL_DOCUMENT_MENU[request.documentType];
  const { isCanView: isCanViewDocument } = useMenuAccess(
    documentMenu ?? MENU.APPROVAL_REQUEST,
  );
  const documentHref =
    document && documentMenu && isCanViewDocument
      ? approvalDocumentHref(request.documentType, document)
      : null;

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
            <>
              {`${document.code} — ${document.title}`}
              {documentHref ? (
                <Link
                  href={documentHref}
                  className={cn(LINK, "mt-1 block w-fit")}
                >
                  Lihat{" "}
                  {APPROVAL_DOCUMENT_LABEL[request.documentType].toLowerCase()}
                </Link>
              ) : null}
            </>
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
