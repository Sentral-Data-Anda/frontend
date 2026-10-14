"use client";

import { DashboardCard } from "@/components/common/dashboard";
import { EmptyState } from "@/components/common/feedback";
import { MENU, menuHref } from "@/config/menu";
import { formatRupiah } from "@/lib/format";

import { useMonthlyFlow } from "../../api";
import { useNow } from "../../hooks/use-now";
import { toDateKey } from "../../model";

import { niceCeiling } from "./data";
import { Legend } from "./legend";

const MONTH_LABEL = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export const IncomeExpenseChart = () => {
  const today = toDateKey(new Date());
  const now = useNow();
  const year = now ? toDateKey(now).slice(0, 4) : "";
  const flow = useMonthlyFlow(today);
  const max = niceCeiling(
    Math.max(0, ...flow.months.flatMap((m) => [m.income, m.expense])),
  );

  // Belum ada satu rupiah pun sepanjang tahun: sumbu dengan dua belas bulan
  // tanpa satu batang pun tidak memberi tahu apa-apa, dan terbaca seperti
  // grafik yang gagal digambar.
  const isFlat = flow.months.every(
    (month) => month.income === 0 && month.expense === 0,
  );

  return (
    <DashboardCard
      title="Masuk vs Keluar"
      trailing={<Legend />}
      actionLabel="Laporan"
      actionHref={menuHref(MENU.REPORT, MENU.FINANCIAL_STATEMENT)}
      query={flow}
      isFilling
      isEmpty={isFlat}
      minHeight="min-h-44"
    >
      {isFlat ? (
        <EmptyState
          isCompact
          title={`Belum ada pemasukan atau pengeluaran ${year}`}
        />
      ) : (
        <>
          {/* `h-full` mengikuti tinggi kartu ketika kartu ini yang menyerap sisa
          tinggi kolom (lihat `isFilling`); tanpa itu batangnya tetap 144px dan
          sisanya jadi lubang kosong. `min-h-36` yang menjaga tingginya saat
          kartunya tidak diregangkan. */}
          <div aria-hidden className="flex h-full min-h-36 items-end gap-1.5">
            {MONTH_LABEL.map((label, index) => {
              const month = flow.months[index];
              return (
                <div
                  key={label}
                  className="flex h-full min-w-0 flex-1 flex-col"
                >
                  <div className="flex flex-1 items-end justify-center gap-1">
                    {(
                      [
                        ["income", "bg-chart-income", month?.income ?? 0],
                        ["expense", "bg-chart-expense", month?.expense ?? 0],
                      ] as const
                    ).map(([key, color, value]) => (
                      <span
                        key={key}
                        title={`${label}: ${key === "income" ? "masuk" : "keluar"} ${formatRupiah(value)}`}
                        className={`${color} w-full max-w-3 min-w-1.5 rounded-t-sm`}
                        style={{ height: `${(value / max) * 100}%` }}
                      />
                    ))}
                  </div>
                  <span className="text-muted-foreground mt-2 text-center text-caption">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* `sr-only` tidak cukup pada elemen tabel: tinggi pada kotak tabel
          dihitung sebagai tinggi minimum dan `overflow` diabaikan, jadi
          tabelnya tetap setinggi isinya dan ikut memanjangkan halaman.
          Pembungkusnya yang disembunyikan. */}
          <div className="sr-only">
            <table>
              <caption>Masuk dan keluar per bulan, {year}</caption>
              <thead>
                <tr>
                  <th scope="col">Bulan</th>
                  <th scope="col">Masuk</th>
                  <th scope="col">Keluar</th>
                </tr>
              </thead>
              <tbody>
                {flow.months.map((m, index) => (
                  <tr key={m.month}>
                    <th scope="row">{MONTH_LABEL[index]}</th>
                    <td>{formatRupiah(m.income)}</td>
                    <td>{formatRupiah(m.expense)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </DashboardCard>
  );
};
