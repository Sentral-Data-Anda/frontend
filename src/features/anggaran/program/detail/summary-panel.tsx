import {
  Badge,
  DescriptionItem,
  DescriptionList,
  OptionalText,
  Panel,
} from "@/components/common/display";
import { formatDate, formatDateTime } from "@/lib/format";

import type { ProgramDetail } from "../types";

interface PropTypes {
  program: ProgramDetail;
}

export const SummaryPanel = (props: PropTypes) => {
  const { program } = props;

  const range = [program.startDate, program.endDate]
    .filter((date): date is string => Boolean(date))
    .map((date) => formatDate(date))
    .join(" – ");

  return (
    <Panel label="Usulan">
      <DescriptionList className="px-gutter py-2">
        <DescriptionItem label="Nama program" isWide>
          {program.name}
        </DescriptionItem>
        <DescriptionItem label="Kode">
          <span className="tabular-nums">{program.code}</span>
        </DescriptionItem>
        <DescriptionItem label="Komisi">
          {program.bapel?.name ?? "—"}
        </DescriptionItem>
        <DescriptionItem label="Tahun pelayanan">
          {program.budgetYear.label}
        </DescriptionItem>
        <DescriptionItem label="Rentang tanggal">
          <OptionalText text={range} empty="Tanpa tanggal" />
        </DescriptionItem>
        <DescriptionItem label="Program mendadak">
          {program.isUnplanned ? (
            <Badge variant="warning">Mendadak</Badge>
          ) : (
            "Tidak"
          )}
        </DescriptionItem>
        <DescriptionItem label="Keterangan" isWide isStacked>
          <OptionalText text={program.description} empty="Tanpa keterangan" />
        </DescriptionItem>

        {program.approvedBy ? (
          <DescriptionItem label="Disetujui" isWide>
            {program.approvedBy.name}
            {program.approvedAt
              ? ` · ${formatDateTime(program.approvedAt)}`
              : ""}
          </DescriptionItem>
        ) : null}
      </DescriptionList>
    </Panel>
  );
};
