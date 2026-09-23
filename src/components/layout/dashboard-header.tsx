import Link from "next/link";

import { buttonVariants } from "@/components/common/button";

export type HeaderAction = { label: string; href: string };

/**
 * Kepala dashboard: sapaan (h1) + tanggal, dan di ≥ lg aksi utama (maks 2)
 * + lonceng. Di < lg aksi tidak ada (Aksi cepat yang menjawabnya) dan
 * lonceng tetap di baris identitas `PageHeader`.
 *
 * `picker` (pemilih tampilan) tampil di SEMUA ukuran, tidak ikut `lg:flex`
 * aksi: alasannya sama di HP — halaman yang terlalu panjang. Ia duduk di kiri
 * aksi supaya tombol utama tetap paling kanan.
 *
 * `suppressHydrationWarning` hanya pada teks bertanggal: sapaan dan tanggal
 * dihitung dari jam saat render, dan render server serta hidrasi bisa jatuh
 * di dua sisi pergantian jam/hari.
 */
export function DashboardHeader({
  title,
  subtitle,
  actions,
  picker,
  trailing,
}: {
  title: string;
  subtitle: string;
  actions: HeaderAction[];
  /** Pemilih tampilan dashboard; tampil di semua ukuran. */
  picker?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <header className="flex items-center gap-3 px-gutter lg:pt-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-lead font-semibold" suppressHydrationWarning>
          {title}
        </h1>
        <p
          className="text-muted-foreground text-body tabular-nums"
          suppressHydrationWarning
        >
          {subtitle}
        </p>
      </div>

      {picker}

      {actions.length || trailing ? (
        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          {/* Prioritas tertinggi = tombol utama, dan tombol utama duduk
              PALING KANAN (dekat lonceng), seperti mockup §10.3. */}
          {actions
            .slice(0, 2)
            .reverse()
            .map((action, index, list) => (
              <Link
                key={action.href}
                href={action.href}
                className={buttonVariants({
                  variant: index === list.length - 1 ? "default" : "outline",
                  className: "whitespace-nowrap",
                })}
              >
                {action.label}
              </Link>
            ))}
          {trailing}
        </div>
      ) : null}
    </header>
  );
}
