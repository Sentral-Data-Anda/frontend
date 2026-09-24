"use client";

import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, X } from "lucide-react";

import {
  FIELD_ITEM,
  FIELD_POPUP,
  type SelectOption,
} from "@/components/common/control/select-field";
import { EmptyState } from "@/components/common/feedback/empty-state";
import { inputVariants } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Kontrol pilihan yang bisa diketik untuk menyaring — untuk daftar 15 nilai ke
 * atas: pekerjaan, suku, wilayah, provinsi, kabupaten, kecamatan, kelurahan,
 * keluarga.
 *
 * Dua mode penyaringan, dan pemanggil memilihnya dengan ada-tidaknya
 * `onSearch`: tanpa `onSearch` daftarnya utuh dan disaring di klien (daftar
 * pendek dan tetap), dengan `onSearch` ketikan dikirim ke server sebagai
 * `?filter=` (keluarga — ratusan baris hari ini, ribuan setelah migrasi).
 *
 * Tiga keadaan yang harus terlihat, dan karena itu komponen ini ada:
 * **memuat** (daftar belum datang), **kosong** (404 dari `ddl/*` = daftar
 * kosong, bukan galat), dan **terkunci** (tingkat alamat di atasnya belum
 * dipilih) — masing-masing dengan kalimatnya sendiri, bukan popup kosong.
 */
export function ComboboxField({
  id,
  value,
  onValueChange,
  options,
  placeholder = "Ketik untuk mencari",
  disabled = false,
  isLoading = false,
  emptyMessage = "Belum ada pilihan",
  isClearable = false,
  onSearch,
  className,
  ...aria
}: {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
  /** Field opsional boleh dikosongkan lagi setelah terisi. */
  isClearable?: boolean;
  /**
   * Ada = penyaringan dilakukan SERVER; ketikan diteruskan ke sini dan
   * penyaringan sisi klien dimatikan. Tanpa mematikannya, daftar 20 baris
   * yang baru datang dari server disaring lagi terhadap ketikan yang sudah
   * berubah, dan popup berkedip kosong di antara dua permintaan.
   */
  onSearch?: (query: string) => void;
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  // Nilai tersimpan adalah kode/id; labelnya baru diketahui setelah daftarnya
  // termuat. Sampai saat itu input memang kosong — detail be-sada tidak
  // mengirim nama relasi (B8), jadi tidak ada yang bisa ditampilkan lebih awal.
  const selected = options.find((option) => option.value === value) ?? null;

  // Terkunci hanya saat BELUM ADA apa pun untuk dipilih. Saat penyaringan
  // sisi server, tiap ketikan memulai permintaan baru — mengunci input di
  // situ berarti huruf berikutnya hilang dan kursor melompat keluar.
  const isBusy = isLoading && options.length === 0;

  return (
    <Combobox.Root
      items={options as SelectOption[]}
      value={selected}
      onValueChange={(next) =>
        onValueChange((next as SelectOption | null)?.value ?? "")
      }
      disabled={disabled || isBusy}
      filter={onSearch ? null : undefined}
      onInputValueChange={onSearch}
    >
      <Combobox.InputGroup
        className={cn(
          inputVariants({ variant: "outline" }),
          "relative flex items-center p-0 focus-within:border-primary has-disabled:cursor-not-allowed has-disabled:opacity-50",
          className,
        )}
      >
        <Combobox.Input
          id={id}
          {...aria}
          placeholder={isBusy ? "Memuat…" : placeholder}
          className="h-full min-w-0 flex-1 cursor-pointer bg-transparent pl-2.5 text-body outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />

        <div className="text-muted-foreground flex h-full shrink-0 items-center pr-1">
          {isClearable && value ? (
            <Combobox.Clear
              aria-label="Kosongkan pilihan"
              className="flex size-6 cursor-pointer items-center justify-center rounded-control hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <X className="size-3.5" aria-hidden />
            </Combobox.Clear>
          ) : null}

          <Combobox.Trigger
            aria-label="Buka pilihan"
            className="flex size-6 cursor-pointer items-center justify-center rounded-control hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <ChevronDown className="size-3.5" aria-hidden />
          </Combobox.Trigger>
        </div>
      </Combobox.InputGroup>

      <Combobox.Portal>
        <Combobox.Positioner
          side="bottom"
          align="start"
          sideOffset={4}
          className="z-50 outline-none"
        >
          <Combobox.Popup className={FIELD_POPUP}>
            {options.length === 0 ? (
              <EmptyState title={emptyMessage} isCompact />
            ) : (
              <>
                <Combobox.Empty>
                  <EmptyState title="Tidak ada yang cocok" isCompact />
                </Combobox.Empty>

                <Combobox.List>
                  {(option: SelectOption) => (
                    <Combobox.Item
                      key={option.value}
                      value={option}
                      className={FIELD_ITEM}
                    >
                      <Combobox.ItemIndicator className="col-start-1">
                        <Check className="size-3.5" aria-hidden />
                      </Combobox.ItemIndicator>
                      <span className="col-start-2 truncate">
                        {option.label}
                      </span>
                    </Combobox.Item>
                  )}
                </Combobox.List>
              </>
            )}
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
