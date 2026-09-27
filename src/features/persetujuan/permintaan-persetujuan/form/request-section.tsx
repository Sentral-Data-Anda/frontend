"use client";

import { DescriptionItem, DescriptionList } from "@/components/common/display";
import { FormSection, FormWide } from "@/components/common/form";
import { formatApprovalAmount } from "@/types/persetujuan";

import { documentTitle, stageLabel, submitterName } from "../model";
import type { ApprovalRequest } from "../types";

interface PropTypes {
  request: ApprovalRequest;
}

export const RequestSection = (props: PropTypes) => {
  const { request } = props;

  return (
    <FormSection legend="Permintaan">
      <FormWide>
        <DescriptionList>
          <DescriptionItem label="Dokumen" isWide>
            {documentTitle(request)}
            {request.document ? (
              <span className="text-muted-foreground block font-normal">
                {request.document.title}
              </span>
            ) : null}
          </DescriptionItem>
          <DescriptionItem label="Nominal">
            <span className="tabular-nums">
              {formatApprovalAmount(request.documentType, request.amount)}
            </span>
          </DescriptionItem>
          <DescriptionItem label="Pengaju">
            {submitterName(request)}
          </DescriptionItem>
          <DescriptionItem label="Tahap">{stageLabel(request)}</DescriptionItem>
        </DescriptionList>
      </FormWide>
    </FormSection>
  );
};
