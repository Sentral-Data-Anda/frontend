import {
  DescriptionItem,
  DescriptionList,
  OptionalText,
  Panel,
} from "@/components/common/display";
import { formatDateTime, formatRupiah } from "@/lib/format";

import type { BudgetReportDetail } from "../types";

interface PropTypes {
  report: BudgetReportDetail;
}

export const SummaryPanel = (props: PropTypes) => {
  const { report } = props;

  return (
    <Panel label="Laporan">
      <DescriptionList className="px-gutter py-2">
        <DescriptionItem label="Kode">
          <span className="tabular-nums">{report.code}</span>
        </DescriptionItem>
        <DescriptionItem label="Badan pelayanan">
          {report.bapel?.name ?? "—"}
        </DescriptionItem>
        <DescriptionItem label="Bulan">{report.label}</DescriptionItem>
        <DescriptionItem label="Total pemakaian">
          <span className="tabular-nums">
            {formatRupiah(Number(report.totalAmount))}
          </span>
        </DescriptionItem>
        <DescriptionItem label="Keterangan" isWide isStacked>
          <OptionalText text={report.note} empty="Tanpa keterangan" />
        </DescriptionItem>

        {report.approvedBy ? (
          <DescriptionItem label="Disetujui" isWide>
            {report.approvedBy.name}
            {report.approvedAt ? ` · ${formatDateTime(report.approvedAt)}` : ""}
          </DescriptionItem>
        ) : null}
      </DescriptionList>
    </Panel>
  );
};
