import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { MENU, menuHref } from "@/config/menu";

import { DUMMY_CASH_SUMMARY } from "./dummy";

const fullFormat = new Intl.NumberFormat("id-ID");

const compactFormat = new Intl.NumberFormat("id-ID", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/**
 * "Rp " ditulis sendiri, bukan `style: "currency"`: pemisah antara "Rp" dan
 * angka berbeda antar versi ICU (spasi, nbsp, atau tanpa spasi), sehingga
 * server dan browser bisa merender teks yang berbeda.
 */
const formatRupiah = (value: number) => `Rp ${fullFormat.format(value)}`;

/** "Rp 86,4 jt". */
const formatRupiahCompact = (value: number) =>
  `Rp ${compactFormat.format(value)}`;

/**
 * Kas gabungan, masuk, dan keluar. DUMMY — lihat `dummy.ts`; pemanggil wajib
 * memeriksa `SHOW_DUMMY` sebelum merender kartu ini.
 */
export function CashSummaryCard() {
  const { balance, income, expense } = DUMMY_CASH_SUMMARY;

  return (
    <Card className="rounded-lg shadow-sm">
      <CardContent>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-muted-foreground text-body">Kas gabungan</p>

          <Link
            href={menuHref(MENU.KEUANGAN, MENU.LAPORAN_KEUANGAN)}
            className="inline-flex min-h-6 items-center text-body font-medium"
          >
            Rincian
          </Link>
        </div>

        <p className="text-lead font-semibold tabular-nums">
          {formatRupiah(balance)}
        </p>

        <dl className="border-border mt-3 grid grid-cols-2 border-t pt-3">
          <div>
            <dt className="text-caption font-semibold tracking-wide uppercase">
              Masuk
            </dt>
            <dd className="text-body font-semibold tabular-nums">
              {formatRupiahCompact(income)}
            </dd>
          </div>

          <div className="border-border border-l pl-3.5">
            <dt className="text-caption font-semibold tracking-wide uppercase">
              Keluar
            </dt>
            <dd className="text-body font-semibold tabular-nums">
              {formatRupiahCompact(expense)}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
