import {
  DescriptionItem,
  DescriptionList,
  PANEL_TITLE,
  Panel,
} from "@/components/common/display";
import { formatDate, formatWeekday } from "@/lib/format";
import { cn } from "@/lib/utils";

import { formatTimeRange, ibadahLabel } from "../model";
import type { JadwalPelayanDetail } from "../types";

interface PropTypes {
  jadwal: JadwalPelayanDetail;
}

export const JadwalPanel = (props: PropTypes) => {
  const { jadwal } = props;

  return (
    <Panel label="Jadwal">
      <h2 className={cn(PANEL_TITLE, "px-gutter pt-4")}>Jadwal</h2>

      <DescriptionList className="px-gutter pb-2">
        <DescriptionItem label="Tanggal">
          {formatWeekday(jadwal.date)}, {formatDate(jadwal.date)}
        </DescriptionItem>
        <DescriptionItem label="Jam">
          <span className="tabular-nums">
            {formatTimeRange(jadwal.startTime, jadwal.endTime)}
          </span>
        </DescriptionItem>
        <DescriptionItem label="Badan pelayanan">
          {jadwal.bapel.name}
        </DescriptionItem>
        <DescriptionItem label="Ibadah" isStacked>
          {jadwal.ibadah.length ? (
            <ul>
              {jadwal.ibadah.map((ibadah) => (
                <li key={ibadah.code}>{ibadahLabel(ibadah)}</li>
              ))}
            </ul>
          ) : (
            <span className="block">
              Belum ditaut ke ibadah
              <span className="text-muted-foreground block text-caption font-normal">
                Tautkan dari form Ibadah.
              </span>
            </span>
          )}
        </DescriptionItem>
        <DescriptionItem label="Kode">
          <span className="tabular-nums">{jadwal.code}</span>
        </DescriptionItem>
      </DescriptionList>
    </Panel>
  );
};
