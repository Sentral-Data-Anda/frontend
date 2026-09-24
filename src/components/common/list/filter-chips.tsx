"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FilterChip = {
  label: string;
  /** Nilai yang dikirim ke API. String kosong berarti "Semua". */
  value: string;
};

/**
 * Baris chip filter, bisa digeser mendatar.
 *
 * Dibangun di atas `Button` yang sudah ada alih-alih `<button>` telanjang,
 * supaya tinggi, radius, dan cincin fokusnya tidak bisa menyimpang dari tombol
 * lain di aplikasi.
 *
 * `aria-pressed`, bukan `aria-selected`: ini sekumpulan tombol toggle, bukan
 * tab maupun listbox, dan `aria-selected` di luar dua peran itu diabaikan
 * pembaca layar.
 */
export function FilterChips({
  options,
  value,
  onPick,
  label,
  className,
}: {
  options: FilterChip[];
  value: string;
  onPick: (value: string) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        // `-mx-gutter px-gutter` membuat chip pertama dan terakhir tetap sejajar dengan
        // isi layar, sementara area gesernya membentang penuh sampai tepi.
        "-mx-gutter flex gap-2 overflow-x-auto px-gutter [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {options.map((option) => {
        const isPicked = option.value === value;

        return (
          <Button
            key={option.value || "semua"}
            type="button"
            size="sm"
            variant={isPicked ? "default" : "outline"}
            aria-pressed={isPicked}
            onClick={() => onPick(option.value)}
            className="rounded-full"
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
}
