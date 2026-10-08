"use client";

import { useEffect, useRef } from "react";

import { SelectField } from "@/components/common/control";
import { Panel } from "@/components/common/display";
import { FormField } from "@/components/common/form";
import { useBoolean } from "@/hooks/use-boolean";
import { monthOptions, monthRange } from "@/lib/date";
import { cn } from "@/lib/utils";

import { usePerubahanAsetNeto } from "../api";
import {
  ASET_NETO_EMPTY_NOTE,
  ASET_NETO_SCROLL_HINT,
  NET_ASSET_CLASS_LABEL,
  NET_ASSET_NOTE,
  money,
} from "../model";
import type { ByNetAssetClass } from "../types";

import { ReportError } from "./report-error";
import { ReportFilters } from "./report-filters";

interface PropTypes {
  month: string;
  onPickMonth: (value: string) => void;
}

type Row = {
  key: string;
  label: string;
  value: ByNetAssetClass | undefined;
  isTotal?: boolean;
};

const CELL = "px-3 py-2 text-right tabular-nums";

export const NetAssetStatement = (props: PropTypes) => {
  const { month, onPickMonth } = props;

  const options = monthOptions();
  const range = monthRange(month);
  const report = usePerubahanAsetNeto(range.startDate, range.endDate);
  const data = report.data;
  const query = {
    isPending: report.isPending,
    isFetching: report.isFetching,
    error: report.error,
    refetch: report.refetch,
  };
  const label =
    options.find((option) => option.value === month)?.label ?? month;

  // Diukur, bukan ditebak dari lebar layar. Breakpoint di layar fitur dilarang
  // di repo ini, dan mengukur justru lebih benar: petunjuknya muncul tepat
  // saat tabelnya memang tidak muat, bukan di bawah lebar tertentu.
  //
  // `scrollWidth` lawan `clientWidth`, bukan `getBoundingClientRect` — yang
  // terakhir melaporkan lebar kotaknya, yang benar, sementara isinya meluber.
  const scroller = useRef<HTMLDivElement>(null);
  const isScrollable = useBoolean(false);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;

    const onMeasure = () =>
      isScrollable.setValue(node.scrollWidth > node.clientWidth + 1);

    onMeasure();

    const observer = new ResizeObserver(onMeasure);
    observer.observe(node);

    return () => observer.disconnect();
  }, [data, isScrollable]);

  const rows: Row[] = [
    { key: "opening", label: "Aset neto awal", value: data?.opening },
    { key: "income", label: "Pendapatan", value: data?.income },
    { key: "expense", label: "Beban", value: data?.expense },
    { key: "change", label: "Kenaikan (penurunan)", value: data?.change },
    // Hanya saat ada isinya: baris nol untuk hal yang hampir tidak pernah
    // terjadi hanya menambah panjang tabel yang harus dibaca tiap bulan.
    ...(data && data.equityMovement.total !== "0"
      ? [
          {
            key: "equity",
            label: "Perubahan ekuitas lain",
            value: data.equityMovement,
          },
        ]
      : []),
    {
      key: "closing",
      label: "Aset neto akhir",
      value: data?.closing,
      isTotal: true,
    },
  ];

  const isUnrestrictedOnly =
    data !== undefined && data.closing.denganPembatasan === "0";

  return (
    <div className="pb-6">
      <ReportFilters>
        <FormField label="Bulan" htmlFor="aset-neto-month">
          <SelectField
            value={month}
            onValueChange={onPickMonth}
            options={options}
          />
        </FormField>
      </ReportFilters>

      <h2 className="hidden px-gutter pb-3 text-lead font-semibold print:block">
        Laporan Perubahan Aset Neto {label}
      </h2>

      {query.error ? (
        <ReportError title="Perubahan Aset Neto gagal dimuat." query={query} />
      ) : (
        <div className="space-y-3 px-gutter">
          {/* Tabelnya memang menggulir mendatar di layar sempit — tiga kolom
              angka yang dikecilkan sampai muat akan terpotong justru di digit
              terakhirnya. Yang TIDAK boleh adalah menggulir tanpa tanda:
              terlihat saat meninjau layarnya, kolom "Dengan pembatasan" —
              seluruh alasan laporan ini ada — berada di luar layar dan tidak
              ada apa pun yang mengatakannya. */}
          {isScrollable.value ? (
            <p className="text-muted-foreground text-caption">
              {ASET_NETO_SCROLL_HINT}
            </p>
          ) : null}

          <Panel>
            <div ref={scroller} className="overflow-x-auto">
              <table className="w-full min-w-[32rem] text-body">
                <caption className="sr-only">
                  Perubahan aset neto {label}, per kelas pembatasan
                </caption>
                <thead>
                  <tr className="border-border text-muted-foreground border-b text-caption">
                    <th scope="col" className="px-3 py-2 text-left font-medium">
                      Keterangan
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-right font-medium"
                    >
                      {NET_ASSET_CLASS_LABEL.tanpaPembatasan}
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-right font-medium"
                    >
                      {NET_ASSET_CLASS_LABEL.denganPembatasan}
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-2 text-right font-medium"
                    >
                      Jumlah
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.key}
                      className={cn(
                        "border-border/60 border-b last:border-0",
                        row.isTotal && "font-semibold",
                      )}
                    >
                      <th
                        scope="row"
                        className="px-3 py-2 text-left font-normal"
                      >
                        {row.label}
                      </th>
                      <td className={CELL}>
                        {money(row.value?.tanpaPembatasan)}
                      </td>
                      <td className={CELL}>
                        {money(row.value?.denganPembatasan)}
                      </td>
                      <td className={cn(CELL, "font-medium")}>
                        {money(row.value?.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <p className="text-muted-foreground text-caption">
            {isUnrestrictedOnly ? ASET_NETO_EMPTY_NOTE : NET_ASSET_NOTE}
          </p>
        </div>
      )}
    </div>
  );
};
