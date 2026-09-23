import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Kerangka dashboard (docs/design/dashboard-desktop.md §3a, §10.5). Yang
 * diukur kolom konten (container query), bukan viewport: lebar yang tersedia
 * di 1024 berbeda antara sidebar penuh dan rail.
 *
 * | Kolom konten | Bentuk |
 * | ------------ | ------ |
 * | < 40rem      | tumpuk satu kolom |
 * | 40–66rem     | main selebar kolom · samping 2 kolom di bawahnya |
 * | 66–82rem     | sama, samping 3 kolom |
 * | 82–120rem    | berdampingan `[main 1.15fr │ samping 1fr]` (bentuk mockup) |
 * | ≥ 120rem     | menumpuk lagi — main DAN samping memecah diri jadi beberapa kolom |
 *
 * Kenapa berdampingan baru mulai 82rem padahal mockup memakai dua kolom di
 * 1440: jumlah widgetnya timpang — tiap dashboard punya 2–3 widget utama yang
 * lebar (grafik, tabel) dan 4–8 widget samping yang sempit. Berdampingan
 * terlalu awal, kolom samping jadi 2,5–3× lebih tinggi daripada kolom utama
 * dan meninggalkan lubang ~1000px di bawahnya (keluhan user). Memecah kolom
 * samping jadi dua baru muat kalau kolom utama tetap ≥ 688px (tabel C berkolom)
 * dan tiap kartu samping ≥ ~290px: 1312 = 694 + 16 + 2 × 294 + 16, terukur di
 * 1440 + rail. Di bawah itu menumpuk justru memberi kolom utama LEBIH lebar
 * (1440 + sidebar penuh: 1130px, bukan 524px).
 *
 * Kenapa berdampingan BERHENTI di 120rem: batas lebar dashboard dilepas
 * (keputusan user 2026-09-23, "isi mengikuti lebar layar sampai habis"). Tanpa
 * batas atas ini, di monitor 2560 bentuk berdampingan merentangkan baris tabel
 * sampai 1.263px dan kartu samping sampai 554px; dengan memecah kolom keduanya
 * kembali terbaca (771px dan 392px) dan halamannya justru jauh lebih pendek.
 *
 * `isStacked` mematikan bentuk berdampingan di lebar berapa pun — lihat propnya.
 *
 * Berdampingan, kolom samping dipecah dua hanya bila kartunya **lima atau
 * lebih**: dengan empat kartu (persona majelis) pecahannya justru membalik
 * ketimpangan — samping 557px vs utama 1089px.
 *
 * Urutan baca sama di semua bentuk: widget utama dulu, lalu widget samping
 * baris demi baris (kiri ke kanan). Slot kosong runtuh: samping kosong → main
 * penuh, dan sebaliknya.
 *
 * Kartu terakhir yang sendirian di barisnya melebar, jadi tidak pernah ada
 * lubang di ujung — aturannya per jumlah kolom, karena itu tiap tingkat
 * dibatasi rentangnya sendiri (`@max-`). Pengecualian: tingkat `auto-fill`
 * (4 kolom ke atas) boleh menyisakan satu petak, karena di situ ia terbaca
 * sebagai grid kartu biasa, bukan sebagai lubang.
 */
const SIDE_GRID =
  "grid min-w-0 gap-4 @min-[40rem]:grid-cols-2 @min-[40rem]:@max-[66rem]:[&>*:last-child:nth-child(odd)]:col-span-2";

/** Kolom samping selebar halaman: 3 kolom, lalu sebanyak yang muat (≈ 400px). */
const SIDE_STACKED =
  "@min-[66rem]:grid-cols-3 @min-[66rem]:@max-[104rem]:[&>*:last-child:nth-child(3n+1)]:col-span-3 @min-[66rem]:@max-[104rem]:[&>*:last-child:nth-child(3n+2)]:col-span-2 @min-[104rem]:grid-cols-[repeat(auto-fill,minmax(24rem,1fr))]";

/** Sama, tapi 82–120rem ia jadi kolom samping sungguhan (1–2 kolom sempit). */
const SIDE_SPLIT =
  "@min-[66rem]:@max-[82rem]:grid-cols-3 @min-[66rem]:@max-[82rem]:[&>*:last-child:nth-child(3n+1)]:col-span-3 @min-[66rem]:@max-[82rem]:[&>*:last-child:nth-child(3n+2)]:col-span-2 @min-[82rem]:@max-[120rem]:grid-cols-1 @min-[82rem]:@max-[120rem]:[&>*:last-child:nth-child(odd)]:col-span-1 @min-[82rem]:@max-[120rem]:has-[>*:nth-child(5)]:grid-cols-2 @min-[82rem]:@max-[120rem]:has-[>*:nth-child(5)]:[&>*:last-child:nth-child(odd)]:col-span-2 @min-[120rem]:grid-cols-[repeat(auto-fill,minmax(24rem,1fr))]";

/**
 * Widget utama (grafik, tabel, batang) saat kolomnya selebar halaman. Di atas
 * ambangnya ia ikut memecah diri: tanpa itu baris tabel di monitor 2560 melar
 * sampai 2.400px dan kolom ITEM serta STATUS berjauhan di dua ujung layar.
 */
const MAIN_STACKED =
  "@min-[104rem]:grid-cols-2 @min-[104rem]:@max-[150rem]:[&>*:last-child:nth-child(odd)]:col-span-2 @min-[150rem]:grid-cols-3 @min-[150rem]:[&>*:last-child:nth-child(3n+1)]:col-span-3 @min-[150rem]:[&>*:last-child:nth-child(3n+2)]:col-span-2";

/** Sama, tapi baru setelah bentuk berdampingan selesai (≥ 120rem). */
const MAIN_SPLIT =
  "@min-[120rem]:grid-cols-2 @min-[120rem]:@max-[150rem]:[&>*:last-child:nth-child(odd)]:col-span-2 @min-[150rem]:grid-cols-3 @min-[150rem]:[&>*:last-child:nth-child(3n+1)]:col-span-3 @min-[150rem]:[&>*:last-child:nth-child(3n+2)]:col-span-2";

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
              "@min-[82rem]:@max-[120rem]:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]",
          )}
        >
          {main.length ? (
            <div
              className={cn(
                "grid min-w-0 gap-4",
                isStacked ? MAIN_STACKED : MAIN_SPLIT,
              )}
            >
              {main}
            </div>
          ) : null}
          {side.length ? (
            <div
              className={cn(SIDE_GRID, isStacked ? SIDE_STACKED : SIDE_SPLIT)}
            >
              {side}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
