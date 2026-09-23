import type { FormHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Kerangka layar isian, dipakai SEMUA form (form-pattern.md §3.3).
 *
 * Satu kolom `max-w-lg` (512px) di semua ukuran, bukan dua kolom di desktop:
 * dua kolom membuat urutan Tab tidak jelas, memecah kelompok field, dan satu
 * aturan untuk 61 layar lebih berharga daripada halaman yang lebih pendek.
 *
 * `header` masuk lewat prop, bukan dirender sendiri oleh layar di atas form,
 * supaya judul dan isian berbagi kolom yang sama — header selebar halaman di
 * atas form selebar 512px terbaca sebagai dua halaman yang bertumpuk.
 */
export function FormLayout({
  header,
  children,
  className,
  ...props
}: FormHTMLAttributes<HTMLFormElement> & { header?: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-lg">
      {header}

      {/*
        `noValidate`: validasinya milik zod, dan gelembung bawaan peramban
        muncul di tempat lain, berbahasa lain, dan hanya untuk satu field.
      */}
      <form noValidate className={cn("pb-6", className)} {...props}>
        {children}
      </form>
    </div>
  );
}

/**
 * Satu kelompok field: `<fieldset>` + `<legend>`.
 *
 * `fieldset` bukan kosmetik — `disabled` padanya mematikan SELURUH kontrol di
 * dalamnya dalam satu atribut, dan itulah yang dipakai saat form sedang
 * menyimpan supaya tidak ada perubahan yang masuk setelah payload dikirim.
 */
export function FormSection({
  legend,
  disabled = false,
  children,
}: {
  legend: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    /*
      Field dibungkus satu `div`, bukan menjadi anak langsung fieldset:
      `<legend>` dirender DI GARIS ATAS fieldset dan `padding-block-start`
      berlaku SESUDAHNYA, jadi `space-y` pada fieldset menambahkan jarak kedua
      di bawah judul — 36px di bawah legend sementara antar-field 16px.
    */
    <fieldset
      disabled={disabled}
      className="border-border border-b px-gutter pt-4 pb-5 last-of-type:border-b-0"
    >
      <legend className="text-title font-semibold">{legend}</legend>
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

/**
 * Baris aksi: "Batal" (outline) lalu "Simpan" (utama) di paling kanan — urutan
 * yang sama dengan kepala dashboard.
 *
 * Di bawah `lg` ia menempel di bawah layar supaya tombol simpan tidak perlu
 * dicari di ujung halaman yang panjangnya ±20 field. Jaraknya dihitung dari
 * tinggi bottom tab: keduanya `sticky bottom-0` di scroll dokumen yang sama,
 * jadi tanpa itu baris aksi tersembunyi persis di balik navigasi.
 *
 * Di `lg` ke atas tidak ada bottom tab dan halamannya muat lebih banyak, jadi
 * ia ikut mengalir — baris melayang di desktop hanya memakan tinggi jendela.
 */
export function FormActions({ children }: { children: ReactNode }) {
  return (
    <div className="border-border bg-card sticky bottom-[calc(var(--bottom-tab-height)+env(safe-area-inset-bottom))] z-30 flex justify-end gap-2 border-t px-gutter py-3 lg:static lg:border-t-0 lg:bg-transparent">
      {children}
    </div>
  );
}

/**
 * Kerangka form yang sedang memuat nilainya (mode ubah).
 *
 * Bentuknya label + kontrol 36px, bukan baris daftar: kerangka yang tidak
 * seukuran isinya membuat halaman melompat saat data tiba, dan lompatan itu
 * terbaca sebagai kedipan.
 */
export function LoadingForm({ fields = 6 }: { fields?: number }) {
  return (
    <div role="status" aria-busy="true" className="space-y-4 px-gutter py-5">
      {/* key={index}: kerangka tidak punya identitas dari data. */}
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} aria-hidden className="space-y-1.5">
          <span className="bg-primary-200 block h-3 w-24 animate-pulse rounded" />
          <span className="bg-primary-200 block h-control w-full animate-pulse rounded-control" />
        </div>
      ))}

      <span className="sr-only">Memuat data jemaat…</span>
    </div>
  );
}
