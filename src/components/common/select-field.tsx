"use client";

import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { inputVariants } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string };

/**
 * Kelas popup pilihan, dipakai bersama `ComboboxField` supaya dua kontrol
 * yang berdampingan di form yang sama tidak punya dua bahasa visual.
 */
export const FIELD_POPUP =
  "bg-popover text-popover-foreground border-border max-h-(--available-height) w-(--anchor-width) origin-(--transform-origin) overflow-y-auto overscroll-contain rounded-control border py-1 shadow-lg transition-[opacity,scale] duration-100 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0";

/**
 * Item pilihan. Tinggi 32px dengan area sentuh penuh lebar — di 390px daftar
 * yang rapat lebih sering salah tekan daripada daftar yang panjang.
 */
export const FIELD_ITEM =
  "grid min-h-8 cursor-pointer grid-cols-[1rem_1fr] items-center gap-2 px-2.5 text-body outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground";

/**
 * Kontrol pilihan untuk daftar pendek dan tetap (≤ ±15 nilai): jenis kelamin,
 * status, tipe, peran, golongan darah. Daftar yang lebih panjang memakai
 * `ComboboxField` — kotak yang bisa diketik untuk menyaring.
 *
 * Gayanya datang dari `inputVariants` yang sama dengan `Input`, bukan dari
 * kelas yang disalin: tinggi 36px, radius 8px, dan garis fokus navy karena itu
 * tidak bisa melenceng dari kontrol di sebelahnya.
 *
 * `id`, `aria-invalid`, dan `aria-describedby` datang dari `FormField` lewat
 * `cloneElement`, persis seperti `Input`.
 *
 * Nilai kosong ditulis `""`, bukan `null`: seluruh nilai form jemaat berupa
 * string. Penerjemahannya ke `null` milik Base UI terjadi di sini saja.
 */
export function SelectField({
  id,
  value,
  onValueChange,
  options,
  placeholder = "Pilih",
  disabled = false,
  emptyMessage = "Belum ada pilihan",
  className,
  ...aria
}: {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  /** 404 dari `ddl/*` berarti daftar kosong, bukan galat (form-pattern.md §3.10). */
  emptyMessage?: string;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  return (
    <Select.Root
      items={options}
      value={value || null}
      onValueChange={(next) => onValueChange((next as string | null) ?? "")}
      disabled={disabled}
    >
      <Select.Trigger
        id={id}
        {...aria}
        className={cn(
          inputVariants({ variant: "outline" }),
          "flex cursor-pointer items-center justify-between gap-2 text-left hover:bg-accent data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-popup-open:border-primary",
          className,
        )}
      >
        {/* `truncate` di anak, bukan di trigger: nilai panjang (nama kelurahan)
            harus terpotong tanpa mendorong ikon chevron keluar. */}
        <Select.Value
          className="truncate data-placeholder:text-muted-foreground"
          placeholder={placeholder}
        />
        <Select.Icon className="text-muted-foreground shrink-0">
          <ChevronDown className="size-3.5" aria-hidden />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Positioner sideOffset={4} className="z-50 outline-none">
          <Select.Popup className={FIELD_POPUP}>
            {options.length === 0 ? (
              <EmptyState title={emptyMessage} isCompact />
            ) : (
              <Select.List>
                {options.map((option) => (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    className={FIELD_ITEM}
                  >
                    <Select.ItemIndicator className="col-start-1">
                      <Check className="size-3.5" aria-hidden />
                    </Select.ItemIndicator>
                    <Select.ItemText className="col-start-2 truncate">
                      {option.label}
                    </Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            )}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
