"use client";

import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";

import { EmptyState } from "@/components/common/feedback/empty-state";
import { MENU_ITEM, MENU_POPUP } from "@/components/common/overlay/popup-style";
import { inputVariants } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string };

/**
 * Cangkang popup pilihan — MENUMPANG pada `MENU_POPUP` yang sudah dipakai menu
 * akun sidebar dan pemilih tampilan dashboard, supaya tidak lahir bahasa
 * visual ketiga untuk hal yang sama: daftar pilihan di atas permukaan.
 *
 * Yang ditambahkan hanya yang khas kontrol form: lebar mengikuti PEMICU
 * (`--anchor-width`) dan tinggi dibatasi 18rem ATAU ruang yang tersedia, mana
 * yang lebih kecil. Batas 18rem itu penting di 390: daftar 13 pilihan setinggi
 * 468px memenuhi hampir seluruh layar dan menutup konteks di sekitarnya —
 * delapan baris cukup untuk memilih, sisanya digulir.
 */
export const FIELD_POPUP = `${MENU_POPUP} max-h-[min(18rem,var(--available-height))] w-(--anchor-width) origin-(--transform-origin) overflow-y-auto overscroll-contain transition-[opacity,scale] duration-100 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0`;

/**
 * Item pilihan — juga `MENU_ITEM`, jadi tinggi (36px), sorotan navy, dan
 * ukuran teks persis sama dengan menu yang sudah ada. Yang ditambahkan hanya
 * kolom penanda "terpilih" di kiri.
 */
export const FIELD_ITEM = `${MENU_ITEM} grid cursor-pointer grid-cols-[1rem_1fr]`;

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
  /** Untuk pilihan tanpa label terlihat (mis. jumlah baris per halaman). */
  "aria-label"?: string;
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
        {/*
          `alignItemWithTrigger={false}` — WAJIB, dan bawaannya `true`.
          Bawaan Base UI menaruh item TERPILIH tepat di atas pemicu, sehingga
          popup menutupi pemicunya sendiri dan bergeser ke kiri mengikuti teks
          item, bukan kotak pemicunya. Terukur di 1440: popup mulai di x=596
          padahal pemicu di x=619, dan y keduanya sama persis (433).
          Perilaku itu masuk akal untuk menu bergaya macOS; di form ia
          menyembunyikan field yang baru saja diklik.
        */}
        <Select.Positioner
          alignItemWithTrigger={false}
          side="bottom"
          align="start"
          sideOffset={4}
          className="z-50 outline-none"
        >
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
