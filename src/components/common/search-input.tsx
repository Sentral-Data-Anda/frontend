"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Kotak cari yang menulis hasilnya ke URL (lewat `useListParams`), dengan
 * jeda.
 *
 * Tanpa jeda, mengetik "budi" mengirim empat permintaan dan menulis empat
 * entri URL. 300ms adalah jeda yang tidak terasa sebagai lambat tapi cukup
 * untuk menelan satu kata yang diketik utuh.
 *
 * `type="search"` bukan kosmetik: ia yang memberi tombol hapus bawaan di
 * Safari iOS dan Chrome, serta tombol "Cari" di papan ketik lunak. Membuat
 * tombol hapus sendiri berarti menulis ulang sesuatu yang sudah ada dan
 * sudah benar per platform.
 */
export function SearchInput({
  value,
  onSearch,
  label,
  placeholder = "Cari",
  className,
}: {
  value: string;
  onSearch: (value: string) => void;
  /** Wajib: input tanpa label yang terlihat tetap harus punya nama. */
  label: string;
  placeholder?: string;
  className?: string;
}) {
  const [draftSearch, setDraftSearch] = useState(value);

  /**
   * `onSearch` IKUT dependency array, dan itu hanya aman karena identitasnya
   * stabil — `useListParams` sengaja membuatnya begitu. Callback yang dibuat
   * ulang tiap render akan menyetel ulang timer di bawah pada setiap render
   * induk, sehingga jedanya tidak pernah sampai selesai.
   */
  useEffect(() => {
    // Sudah sama dengan yang ada di URL — tidak ada yang perlu ditulis. Ini
    // juga yang menghentikan effect setelah URL menyusul nilai draft.
    if (draftSearch === value) return;

    const timer = setTimeout(() => onSearch(draftSearch), 300);

    return () => clearTimeout(timer);
  }, [draftSearch, value, onSearch]);

  return (
    <div className={cn("relative", className)}>
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden
      />

      <Input
        type="search"
        value={draftSearch}
        onChange={(event) => setDraftSearch(event.target.value)}
        aria-label={label}
        placeholder={placeholder}
        autoCapitalize="none"
        autoCorrect="off"
        className="pl-9"
      />
    </div>
  );
}
