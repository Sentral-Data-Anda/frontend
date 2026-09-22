import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Kerangka dashboard (docs/design/dashboard-desktop.md §3a). Yang diukur
 * kolom konten (container query), bukan viewport: lebar yang tersedia di
 * 1024 berbeda antara sidebar penuh dan rail.
 *
 * | Kolom      | Susunan                                           |
 * | ---------- | ------------------------------------------------- |
 * | ≥ 55rem    | KPI · [main 2fr │ samping 1fr]                    |
 * | 40–55rem   | KPI · main penuh · samping jadi baris 2 kolom     |
 * | < 40rem    | tumpuk satu kolom                                 |
 *
 * 55rem, bukan 56rem seperti di dokumen: 1024 + rail memberi kolom 898px —
 * hanya 2px di atas 56rem, dan scrollbar klasik Windows (15–17px) membuatnya
 * jatuh ke dua kolom.
 *
 * Slot kosong runtuh: samping kosong → main penuh, dan sebaliknya; jumlah
 * kartu samping ganjil di baris 2 kolom → kartu terakhir selebar baris.
 * Tidak pernah ada lubang.
 */
export function DashboardGrid({
  kpi,
  between,
  main,
  side,
}: {
  kpi?: ReactNode;
  /** Di antara KPI dan widget (Aksi cepat di HP/tablet). */
  between?: ReactNode;
  main: ReactNode[];
  side: ReactNode[];
}) {
  const isSplit = main.length > 0 && side.length > 0;

  return (
    <div className="@container">
      <div className="flex flex-col gap-4">
        {kpi}
        {between}

        <div
          className={cn(
            "grid items-start gap-4",
            isSplit && "@min-[55rem]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]",
          )}
        >
          {main.length ? (
            <div className="grid min-w-0 gap-4">{main}</div>
          ) : null}
          {side.length ? (
            <div className="grid min-w-0 gap-4 @min-[40rem]:grid-cols-2 @min-[40rem]:[&>*:last-child:nth-child(odd)]:col-span-2 @min-[55rem]:grid-cols-1 @min-[55rem]:[&>*:last-child:nth-child(odd)]:col-span-1">
              {side}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
