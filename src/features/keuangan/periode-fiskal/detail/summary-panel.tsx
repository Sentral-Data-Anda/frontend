import {
  DescriptionItem,
  DescriptionList,
  Panel,
} from "@/components/common/display";
import { formatDateTime } from "@/lib/format";

import { rangeText } from "../model";
import type { FiscalPeriodDetail } from "../types";
import { PeriodStatus } from "../ui";

const byText = (by: { name: string } | null, at: string | null) =>
  at ? `${by?.name ?? "—"} · ${formatDateTime(at)}` : null;

interface PropTypes {
  period: FiscalPeriodDetail;
}

export const SummaryPanel = (props: PropTypes) => {
  const { period } = props;

  const closed = byText(period.closedBy, period.closedAt);
  const reopened = byText(period.reopenedBy, period.reopenedAt);

  return (
    <Panel label="Ringkasan periode">
      <DescriptionList className="px-gutter py-2">
        <DescriptionItem label="Bulan">{period.label}</DescriptionItem>

        <DescriptionItem label="Rentang">
          <span className="tabular-nums">{rangeText(period)}</span>
        </DescriptionItem>

        <DescriptionItem label="Status">
          <PeriodStatus status={period.status} />
        </DescriptionItem>

        <DescriptionItem label="Ditutup oleh">
          {closed ?? (
            <span className="text-muted-foreground font-normal">
              Belum pernah ditutup
            </span>
          )}
        </DescriptionItem>

        {reopened ? (
          <DescriptionItem label="Dibuka kembali oleh">
            {reopened}
          </DescriptionItem>
        ) : null}
      </DescriptionList>

      {period.reopenReason ? (
        <div className="border-hairline mx-gutter mb-4 rounded-control border p-3">
          <p className="text-muted-foreground text-body">
            Alasan dibuka kembali
          </p>
          <p className="mt-1 text-body wrap-break-word whitespace-pre-line">
            {period.reopenReason}
          </p>
        </div>
      ) : null}
    </Panel>
  );
};
