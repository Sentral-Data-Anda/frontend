"use client";

import { formatNumber, formatRupiah } from "@/lib/format";

import type { UntaggedSpending } from "../types";

interface PropTypes {
  untagged: UntaggedSpending;
}

// Kolom pilihan menghilangkan ambiguitasnya; baris ini membuat SISANYA
// terlihat. Dirender sekali di kaki tabel, bukan sebagai kolom per baris: ia
// tidak dimiliki komisi mana pun. Tetap dirender saat nol — nol adalah
// informasi, dan ketiadaannya yang membuat pengelakan ini tak terlihat.
export const UntaggedRow = (props: PropTypes) => {
  const { untagged } = props;

  const amount = formatRupiah(Number(untagged.amount));
  const count = formatNumber(untagged.count);

  return (
    <section
      aria-label="Pengeluaran tanpa komisi"
      className="border-border mx-gutter border-t py-3"
    >
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-body font-medium">
          Pengeluaran tanpa komisi bulan {untagged.label}
        </p>
        <p className="text-body font-medium tabular-nums">
          {amount} ({count} dokumen)
        </p>
      </div>

      <p className="text-muted-foreground mt-1 text-caption">
        Dinyatakan bukan belanja komisi{" "}
        {formatRupiah(Number(untagged.stated.amount))} (
        {formatNumber(untagged.stated.count)}) · dicatat sebelum pertanyaannya
        ada {formatRupiah(Number(untagged.inherited.amount))} (
        {formatNumber(untagged.inherited.count)})
      </p>
    </section>
  );
};
