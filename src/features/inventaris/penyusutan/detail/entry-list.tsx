"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import {
  DataList,
  DataListRow,
  TABLE_ROW_LINK,
  type DataTableConfig,
} from "@/components/common/list";
import { useIsTableWidth } from "@/hooks/use-media";

import { assetHref, formatAmount, isCalculated } from "../model";
import type { RunDetail, RunEntry } from "../types";

const hrefOf = (entry: RunEntry) => assetHref(entry.asset.code);

const labelOf = (entry: RunEntry) => `Lihat barang ${entry.asset.name}`;

const amountCell = (value: string) => (
  <span className="tabular-nums">{formatAmount(value)}</span>
);

const entryTable = (isCanViewAsset: boolean): DataTableConfig<RunEntry> => ({
  columns: [
    {
      key: "asset",
      header: "Barang",
      width: "minmax(0,2.5fr)",
      cell: (entry) => (
        <span className="block min-w-0">
          <span className="block truncate font-medium" title={entry.asset.name}>
            {entry.asset.name}
          </span>
          <span className="text-muted-foreground block truncate text-caption tabular-nums">
            {entry.asset.code}
          </span>
        </span>
      ),
    },
    {
      key: "amount",
      header: "Penyusutan",
      width: "minmax(0,1fr)",
      align: "end",
      cell: (entry) => amountCell(entry.amount),
    },
    {
      key: "accumulatedAfter",
      header: "Akumulasi",
      width: "minmax(0,1fr)",
      align: "end",
      cell: (entry) => amountCell(entry.accumulatedAfter),
    },
    {
      key: "bookValueAfter",
      header: "Nilai buku",
      width: "minmax(0,1fr)",
      align: "end",
      cell: (entry) => amountCell(entry.bookValueAfter),
    },
  ],
  getRowHref: isCanViewAsset ? hrefOf : undefined,
  getRowLabel: labelOf,
  rowIcon: <ChevronRight />,
});

const emptyDescriptionOf = (run: RunDetail, isCanUpdate: boolean) => {
  if (isCalculated(run)) {
    return "Tidak ada barang yang disusutkan pada periode ini.";
  }

  return isCanUpdate && run.status === "DRAFT"
    ? "Tekan Hitung untuk menghitung penyusutan periode ini."
    : "Periode ini belum dihitung.";
};

interface PropTypes {
  run: RunDetail;
  isCanViewAsset: boolean;
  isCanUpdate: boolean;
}

export const EntryList = (props: PropTypes) => {
  const { run, isCanViewAsset, isCanUpdate } = props;

  const isTableWidth = useIsTableWidth();

  return (
    <section aria-labelledby="run-entries" className="pt-6">
      <h2 id="run-entries" className="px-gutter pb-3 text-title font-semibold">
        Rincian per barang
      </h2>

      <DataList
        items={run.entries}
        getKey={(entry) => entry.publicId}
        label="Rincian penyusutan per barang"
        emptyTitle={isCalculated(run) ? "Tidak ada rincian" : "Belum dihitung"}
        emptyDescription={emptyDescriptionOf(run, isCanUpdate)}
        table={entryTable(isCanViewAsset)}
        itemNoun="barang"
      >
        {(entry) => (
          <DataListRow
            id={entry.publicId}
            className={
              isCanViewAsset ? "hover:bg-card relative transition-colors" : ""
            }
            title={
              isCanViewAsset ? (
                <Link
                  href={hrefOf(entry)}
                  aria-label={labelOf(entry)}
                  className={TABLE_ROW_LINK}
                >
                  {entry.asset.name}
                </Link>
              ) : (
                entry.asset.name
              )
            }
            meta={`Nilai buku ${formatAmount(entry.bookValueAfter)}`}
            trailing={
              <span className="text-body font-medium tabular-nums">
                {formatAmount(entry.amount)}
              </span>
            }
          />
        )}
      </DataList>

      {run.entries.length > 0 && isTableWidth === false ? (
        <div className="border-border mx-gutter flex items-baseline justify-between gap-4 border-t py-3">
          <span className="text-body font-semibold">
            Total penyusutan {run.entries.length} barang
          </span>
          <span className="text-body font-semibold tabular-nums">
            {formatAmount(run.totalAmount)}
          </span>
        </div>
      ) : null}
    </section>
  );
};
