import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Kerangka dashboard (docs/design/dashboard-desktop.md §3a). Yang diukur
 * kolom konten (container query), bukan viewport: lebar yang tersedia di
 * 1024 berbeda antara sidebar penuh dan rail.
 *
 * | Kolom      | Susunan                                           |
 * | ---------- | ------------------------------------------------- |
 * | ≥ 70rem    | KPI · [main 1.6fr │ samping 1.8fr dalam 2 kolom]  |
 * | 55–70rem   | KPI · [main 1.6fr │ samping 1fr]                  |
 * | 40–55rem   | KPI · main penuh · samping jadi baris 2 kolom     |
 * | < 40rem    | tumpuk satu kolom                                 |
 *
 * 55rem, bukan 56rem seperti di dokumen: 1024 + rail memberi kolom 898px —
 * hanya 2px di atas 56rem, dan scrollbar klasik Windows (15–17px) membuatnya
 * jatuh ke dua kolom.
 *
 * Tingkat 70rem ada karena jumlah widgetnya timpang: dashboard mana pun punya
 * 3 widget utama dan 4–7 widget samping. Dengan dua kolom, di layar lebar
 * kolom samping memanjang jauh melewati kolom utama dan menyisakan lubang
 * kosong setinggi setengah layar di bawah main. Mulai 70rem kolom samping
 * dipecah dua sehingga tingginya kira-kira separuh, dan porsi lebarnya naik
 * (1.8fr) supaya tiap kartu samping tetap ≈ 290px ke atas — selebar kartu di
 * HP, batas di mana daftar dan baris nominalnya masih terbaca.
 *
 * Urutan baca tidak berubah: kolom samping mengalir baris demi baris (kiri ke
 * kanan), jadi widget terpenting tetap di baris teratas.
 *
 * Dipecah hanya bila kartu sampingnya **lima atau lebih** (`:has(>
 * *:nth-child(5))`). Dengan empat kartu atau kurang, memecahnya justru membalik
 * ketimpangannya: kolom samping jadi setengah tinggi kolom utama (terukur di
 * persona majelis).
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
            isSplit &&
              "@min-[55rem]:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] @min-[70rem]:grid-cols-[minmax(0,1.6fr)_minmax(0,1.8fr)]",
          )}
        >
          {main.length ? (
            <div className="grid min-w-0 gap-4">{main}</div>
          ) : null}
          {side.length ? (
            <div className="grid min-w-0 gap-4 @min-[40rem]:grid-cols-2 @min-[40rem]:[&>*:last-child:nth-child(odd)]:col-span-2 @min-[55rem]:grid-cols-1 @min-[55rem]:[&>*:last-child:nth-child(odd)]:col-span-1 @min-[70rem]:has-[>*:nth-child(5)]:grid-cols-2 @min-[70rem]:has-[>*:nth-child(5)]:[&>*:last-child:nth-child(odd)]:col-span-2">
              {side}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
