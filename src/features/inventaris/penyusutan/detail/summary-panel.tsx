import {
  DescriptionItem,
  DescriptionList,
  Panel,
} from "@/components/common/display";
import { formatDateTime, formatNumber } from "@/lib/format";

import { formatAmount, isCalculated } from "../model";
import type { RunDetail } from "../types";

const journalEmptyOf = (run: RunDetail) =>
  run.status === "POSTED" ? "Tanpa jurnal (0 barang)" : "Belum ada jurnal";

interface PropTypes {
  run: RunDetail;
}

export const SummaryPanel = (props: PropTypes) => {
  const { run } = props;

  const isDone = isCalculated(run);

  return (
    <Panel label="Ringkasan penyusutan">
      <div className="px-gutter pt-4">
        <p className="text-muted-foreground text-body">Total penyusutan</p>
        {isDone ? (
          <p className="text-kpi font-semibold tracking-tight wrap-break-word tabular-nums">
            {formatAmount(run.totalAmount)}
          </p>
        ) : (
          <p className="text-muted-foreground text-kpi font-semibold tracking-tight">
            Belum dihitung
          </p>
        )}
      </div>

      <DescriptionList className="px-gutter pb-2">
        <DescriptionItem label="Jumlah barang">
          <span className="tabular-nums">
            {isDone ? `${formatNumber(run.entries.length)} barang` : "—"}
          </span>
        </DescriptionItem>
        <DescriptionItem label="Terakhir dihitung">
          <span className="tabular-nums">
            {run.updatedAt ? formatDateTime(run.updatedAt) : "Belum dihitung"}
          </span>
        </DescriptionItem>
        <DescriptionItem label="Diposting pada">
          <span className="tabular-nums">
            {run.postedAt ? formatDateTime(run.postedAt) : "Belum diposting"}
          </span>
        </DescriptionItem>
        <DescriptionItem label="Jurnal">
          {run.journal ? (
            <span className="tabular-nums">{run.journal.code}</span>
          ) : (
            <span className="text-muted-foreground font-normal">
              {journalEmptyOf(run)}
            </span>
          )}
        </DescriptionItem>
      </DescriptionList>
    </Panel>
  );
};
