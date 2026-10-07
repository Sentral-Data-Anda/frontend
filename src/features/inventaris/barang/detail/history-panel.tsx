"use client";

import { Panel } from "@/components/common/display";
import { formatAmount } from "@/lib/format";
import { APPROVAL_STATUS_LABEL } from "@/types/persetujuan";

import { DISPOSAL_METHOD_LABEL, MAINTENANCE_STATUS_LABEL } from "../model";
import type { Disposal, Maintenance, Transfer } from "../types";

import { HistoryGroup, type HistoryLine } from "./history-group";

const maintenanceLine = (row: Maintenance): HistoryLine => ({
  date: row.completedDate ?? row.scheduledDate,
  summary: row.description,
  note: MAINTENANCE_STATUS_LABEL[row.status],
});

const transferLine = (row: Transfer): HistoryLine => ({
  date: row.transferDate,
  summary:
    row.fromRoom.code === row.toRoom.code
      ? `${row.fromBapel.name} → ${row.toBapel.name}`
      : `${row.fromRoom.name} → ${row.toRoom.name}`,
});

const disposalLine = (row: Disposal): HistoryLine => ({
  date: row.disposalDate,
  summary: DISPOSAL_METHOD_LABEL[row.method],
  note: [
    APPROVAL_STATUS_LABEL[row.status],
    row.method === "SOLD" ? formatAmount(row.proceeds) : null,
  ]
    .filter(Boolean)
    .join(" · "),
});

interface PropTypes {
  assetId: number;
  code: string;
}

export const HistoryPanel = (props: PropTypes) => {
  const { assetId, code } = props;

  return (
    <Panel label="Riwayat" className="px-gutter py-4">
      <h2 className="mb-3 text-title font-semibold">Riwayat</h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-x-8 gap-y-5">
        <HistoryGroup
          kind="perawatan"
          assetId={assetId}
          code={code}
          title="Perawatan"
          emptyText="Belum ada perawatan."
          lineOf={maintenanceLine}
        />
        <HistoryGroup
          kind="mutasi"
          assetId={assetId}
          code={code}
          title="Pindah lokasi"
          emptyText="Belum pernah dipindah."
          lineOf={transferLine}
        />
        <HistoryGroup
          kind="pelepasan"
          assetId={assetId}
          code={code}
          title="Pelepasan"
          emptyText="Belum ada pelepasan."
          lineOf={disposalLine}
        />
      </div>
    </Panel>
  );
};
