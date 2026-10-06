import { FileCheck, Gauge, Lightbulb, Wallet } from "lucide-react";

import { KpiCell, KpiStrip, ProgressBar } from "@/components/common/dashboard";
import {
  DescriptionItem,
  DescriptionList,
  Panel,
} from "@/components/common/display";
import { formatDate } from "@/lib/format";

import {
  BAR_ALERT_ABOVE,
  THREE_NUMBERS_NOTE,
  amountText,
  barMetaOf,
  barTitleOf,
  percentOf,
} from "../model";
import type { BudgetAllocationDetail } from "../types";

interface PropTypes {
  allocation: BudgetAllocationDetail;
}

export const SummaryPanel = (props: PropTypes) => {
  const { allocation } = props;

  const { usage, budgetYear } = allocation;
  const name = allocation.bapel?.name ?? "Badan pelayanan";
  const range = `${formatDate(budgetYear.from)} – ${formatDate(budgetYear.to)}`;

  return (
    <div className="space-y-4">
      <KpiStrip label="Angka pagu anggaran">
        <KpiCell
          label="Pagu"
          icon={Gauge}
          value={amountText(usage.ceiling)}
          hint={budgetYear.label}
        />
        <KpiCell
          label="Program disetujui"
          icon={Lightbulb}
          tone="secondary"
          value={amountText(usage.committed)}
          hint="Sudah dijanjikan ke program"
        />
        <KpiCell
          label="Dilaporkan"
          icon={FileCheck}
          tone="success"
          value={amountText(usage.reported)}
          hint="Laporan yang sudah disetujui"
        />
        <KpiCell
          label="Sisa"
          icon={Wallet}
          tone="warning"
          value={amountText(usage.remaining)}
          hint="Pagu dikurangi program disetujui"
        />
      </KpiStrip>

      <Panel>
        <div className="space-y-4 px-gutter py-4">
          <ProgressBar
            label="Dilaporkan terhadap pagu"
            title={barTitleOf(name)}
            value={percentOf(usage)}
            meta={barMetaOf(usage)}
            alertAbove={BAR_ALERT_ABOVE}
          />

          <p className="text-muted-foreground max-w-prose text-caption">
            {THREE_NUMBERS_NOTE}
          </p>
        </div>

        <DescriptionList className="border-hairline border-t px-gutter py-2">
          <DescriptionItem label="Badan pelayanan">{name}</DescriptionItem>
          <DescriptionItem label="Tahun pelayanan">
            {budgetYear.label}
          </DescriptionItem>
          <DescriptionItem label="Periode" isWide>
            {range}
          </DescriptionItem>
          <DescriptionItem label="Pagu">
            {amountText(usage.ceiling)}
          </DescriptionItem>
          <DescriptionItem label="Program disetujui">
            {amountText(usage.committed)}
          </DescriptionItem>
          <DescriptionItem label="Dicairkan">
            {amountText(usage.disbursed)}
          </DescriptionItem>
          <DescriptionItem label="Dilaporkan">
            {amountText(usage.reported)}
          </DescriptionItem>
          <DescriptionItem label="Sisa">
            {amountText(usage.remaining)}
          </DescriptionItem>
        </DescriptionList>
      </Panel>
    </div>
  );
};
