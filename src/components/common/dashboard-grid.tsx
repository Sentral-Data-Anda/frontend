import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Kerangka dashboard (docs/design/dashboard-desktop.md §3a). Yang diukur
 * kolom konten (container query), bukan viewport: lebar yang tersedia di
 * 1024 berbeda antara sidebar penuh dan rail.
 *
 * | Kolom      | Susunan                                              |
 * | ---------- | ---------------------------------------------------- |
 * | ≥ 82rem    | KPI · [main 1.15fr │ samping 1fr dalam 2 kolom]      |
 * | 40–82rem   | KPI · main SELEBAR KOLOM · samping jadi baris 2 kolom |
 * | < 40rem    | tumpuk satu kolom                                     |
 *
 * Kenapa berdampingan baru mulai 84rem, padahal mockup memakai dua kolom di
 * 1440: jumlah widgetnya timpang — tiap dashboard punya 2–3 widget utama yang
 * lebar (grafik, tabel) dan 4–8 widget samping yang sempit. Berdampingan,
 * kolom samping jadi 2,5–3× lebih tinggi daripada kolom utama dan meninggalkan
 * lubang kosong ~1000px di bawahnya (keluhan user).
 *
 * Memecah kolom samping jadi dua memperbaikinya, tapi hanya muat kalau
 * SETELAHNYA kolom utama masih ≥ 688px (supaya tabel C tetap berkolom, bukan
 * bentuk ringkas) dan tiap kartu samping ≥ ~310px. Syarat itu baru terpenuhi
 * pada 82rem: 1312 = 694 (utama) + 16 + 2 × 294 + 16 — terukur di 1440 + rail. Di bawah itu, satu-satunya
 * susunan yang tidak menyisakan lubang adalah menumpuk — dan menumpuk justru
 * memberi kolom utama LEBIH lebar (di 1440 + sidebar penuh: 1130px penuh untuk
 * tabel, bukan 524px). Lebar kolom utama karena itu tidak pernah mengecil saat
 * jendela melebar di dalam satu bentuk.
 *
 * Konsekuensi yang diterima: di 1440 + sidebar penuh (kolom 1130px) susunannya
 * menumpuk; tampilan berdampingan seperti mockup muncul mulai 1440 + rail.
 *
 * `isStacked` mematikan bentuk berdampingan sepenuhnya — lihat propnya.
 *
 * Berdampingan, kolom samping dipecah dua hanya bila kartunya **lima atau
 * lebih**: dengan empat kartu (persona majelis) pecahannya justru membalik
 * ketimpangan — samping 557px vs utama 1089px.
 *
 * Urutan baca sama di kedua bentuk: widget utama dulu, lalu widget samping
 * baris demi baris (kiri ke kanan).
 *
 * Slot kosong runtuh: samping kosong → main penuh, dan sebaliknya; jumlah
 * kartu samping ganjil → kartu terakhir selebar barisnya. Tidak pernah ada
 * lubang.
 */
export function DashboardGrid({
  kpi,
  between,
  main,
  side,
  isStacked = false,
}: {
  kpi?: ReactNode;
  /** Di antara KPI dan widget (Aksi cepat di HP/tablet). */
  between?: ReactNode;
  main: ReactNode[];
  side: ReactNode[];
  /**
   * Paksa bentuk menumpuk di lebar berapa pun. Dipakai tampilan "Semua":
   * gabungan dua grup membuat kolom utama jauh lebih pendek daripada kolom
   * samping (terukur: lubang 697–969px di 1920 + rail, sisa 272px saat
   * menumpuk).
   */
  isStacked?: boolean;
}) {
  const isSplit = !isStacked && main.length > 0 && side.length > 0;

  return (
    <div className="@container">
      <div className="flex flex-col gap-4">
        {kpi}
        {between}

        <div
          className={cn(
            "grid items-start gap-4",
            isSplit &&
              "@min-[82rem]:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]",
          )}
        >
          {main.length ? (
            <div className="grid min-w-0 gap-4">{main}</div>
          ) : null}
          {side.length ? (
            <div className="grid min-w-0 gap-4 @min-[40rem]:grid-cols-2 @min-[40rem]:[&>*:last-child:nth-child(odd)]:col-span-2 @min-[82rem]:grid-cols-1 @min-[82rem]:[&>*:last-child:nth-child(odd)]:col-span-1 @min-[82rem]:has-[>*:nth-child(5)]:grid-cols-2 @min-[82rem]:has-[>*:nth-child(5)]:[&>*:last-child:nth-child(odd)]:col-span-2">
              {side}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
