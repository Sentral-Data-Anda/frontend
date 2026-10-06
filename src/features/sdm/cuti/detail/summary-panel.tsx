import {
  DescriptionItem,
  DescriptionList,
  Panel,
} from "@/components/common/display";
import { formatDateTime, formatDays } from "@/lib/format";

import { rangeTextOf } from "../model";
import type { Cuti } from "../types";

interface PropTypes {
  cuti: Cuti;
}

export const SummaryPanel = (props: PropTypes) => {
  const { cuti } = props;

  return (
    <Panel label="Ringkasan">
      <div className="px-gutter py-2">
        <DescriptionList>
          <DescriptionItem label="Karyawan">
            {cuti.karyawan.name}
          </DescriptionItem>

          <DescriptionItem label="Jabatan">
            {cuti.karyawan.position}
          </DescriptionItem>

          <DescriptionItem label="Tipe cuti">
            {cuti.leaveType.name}
          </DescriptionItem>

          <DescriptionItem label="Hari">
            {formatDays(cuti.totalDays)}
          </DescriptionItem>

          <DescriptionItem label="Tanggal" isWide>
            {rangeTextOf(cuti.startDate, cuti.endDate)}
          </DescriptionItem>

          {cuti.approvedAt ? (
            <DescriptionItem label="Disetujui" isWide>
              {formatDateTime(cuti.approvedAt)}
            </DescriptionItem>
          ) : null}
        </DescriptionList>
      </div>
    </Panel>
  );
};
