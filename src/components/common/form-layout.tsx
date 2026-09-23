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
  actions,
  children,
  className,
  ...props
}: FormHTMLAttributes<HTMLFormElement> & {
  header?: ReactNode;
  /**
   * Baris aksi (`FormActions`). Prop sendiri, bukan anak, karena ia TIDAK
   * boleh ikut terkurung kolom 512px: di bawah `lg` ia selebar layar,
   * sedangkan isinya tetap sejajar kolom. Ia tetap di dalam `<form>` supaya
   * tombol `type="submit"` bekerja.
   */
  actions?: ReactNode;
}) {
  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-lg">{header}</div>

      {/*
        `noValidate`: validasinya milik zod, dan gelembung bawaan peramban
        muncul di tempat lain, berbahasa lain, dan hanya untuk satu field.

        `data-slot`: penanda yang dibaca `globals.css` untuk memasang
        `scroll-padding-bottom` di dokumen, supaya field terakhir dan baris
        catatan tidak tersembunyi di balik baris aksi yang menempel.

        Tanpa padding bawah: baris aksi adalah elemen terakhir halaman, dan
        padding di sini dulu menyisakan jalur kanvas di bawahnya — bilah
        putih terlihat mengambang, bukan menempel ke tepi layar.
      */}
      <form
        noValidate
        data-slot="form-layout"
        className={cn("w-full", className)}
        {...props}
      >
        <div className="mx-auto w-full max-w-lg">{children}</div>
        {actions}
      </form>
    </div>
  );
}

/**
 * Satu kelompok field: `<fieldset>` + `<legend>`.
 *
 * `fieldset` bukan kosmetik — `disabled` padanya mematikan SELURUH kontrol
 * native di dalamnya dalam satu atribut, dan itulah yang dipakai saat form
 * sedang menyimpan supaya tidak ada perubahan yang masuk setelah payload
 * dikirim.
 *
 * TIDAK CUKUP SENDIRIAN, dan ini terukur: kontrol Base UI (`Select`,
 * `Combobox`) memasang pemicunya lewat handler sendiri dan popup-nya di
 * portal, DI LUAR fieldset — selagi menyimpan, popup pilihan masih bisa
 * terbuka dan nilainya berubah setelah payload dikirim. Karena itu layar
 * TETAP meneruskan `disabled` ke tiap kontrol pilihan; fieldset menjaga yang
 * native, prop menjaga sisanya.
 */
export function FormSection({
  legend,
  note,
  disabled = false,
  children,
}: {
  legend: string;
  /**
   * Satu kalimat di kepala kelompok, menggantikan penanda per field.
   *
   * Dipakai saat MAYORITAS field di kelompok itu opsional: menuliskan
   * "(opsional)" empat kali berturut-turut berhenti memberi informasi dan
   * mulai jadi bising — mata melewatinya, dan yang satu-satunya wajib justru
   * ikut terlewat. Satu kalimat menyampaikan hal yang sama sekali baca.
   */
  note?: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    /*
      Jarak di sekitar garis pemisah SIMETRIS: isi terakhir → garis 20px, dan
      garis → judul kelompok berikutnya 20px. Judul → isinya sendiri lebih
      rapat (12px), supaya judul terbaca milik isi di bawahnya, bukan milik
      garis di atasnya.

      Kenapa `<legend>` diapungkan: bawaan peramban melukis legend DI GARIS
      ATAS fieldset, dan `padding-top` baru berlaku sesudahnya — jadi padding
      apa pun tidak pernah memberi ruang di ATAS judul, dan judulnya menempel
      pada garis kelompok sebelumnya (terukur 0px). Legend yang diapungkan
      selebar penuh kembali ke aliran biasa: padding atas fieldset jatuh di
      atasnya, persis seperti elemen lain. Semantiknya tidak berubah —
      tetap `<legend>` pertama milik fieldset, jadi tetap nama grupnya.
    */
    <fieldset
      disabled={disabled}
      className="border-border border-b px-gutter py-5 last-of-type:border-b-0"
    >
      <legend className="float-left mb-3 w-full text-title font-semibold">
        {legend}
      </legend>

      <div className="clear-left">
        {note ? (
          <p className="text-muted-foreground mb-4 text-caption">{note}</p>
        ) : null}

        {/*
          SATU sumber jarak antar-field: 16px dari elemen terakhir sebuah
          field (kontrol, atau pesannya bila ada) ke label field berikutnya —
          sama untuk field berpetunjuk, tanpa petunjuk, dan bergalat.
          `FormField` sendiri tidak memberi jarak ke bawah, jadi tidak ada
          jarak ganda.
        */}
        <div className="space-y-4">{children}</div>
      </div>
    </fieldset>
  );
}

/**
 * Baris aksi: "Batal" (outline) lalu "Simpan" (utama) di paling kanan — urutan
 * yang sama dengan kepala dashboard.
 *
 * Di bawah `lg`: menempel di bawah layar, SELEBAR LAYAR, bidang putih sampai
 * tepi bawah termasuk area aman iPhone. Dulu ia selebar kolom form (512px) dan
 * ada jalur kanvas di bawahnya, jadi di tablet ia terlihat seperti kotak
 * mengambang. Isinya tetap dibatasi kolom yang sama dengan field, sehingga
 * tombol kanan sejajar dengan tepi kanan field.
 *
 * Di `lg` ke atas ia ikut mengalir di akhir form, selebar kolom, dengan garis
 * atas sebagai tepinya — baris melayang di desktop hanya memakan tinggi
 * jendela.
 */
export function FormActions({ children }: { children: ReactNode }) {
  return (
    <div className="border-border bg-card sticky bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] lg:static lg:border-t-0 lg:bg-transparent lg:pb-8">
      <div className="lg:border-border mx-auto flex w-full max-w-lg justify-end gap-2 px-gutter py-3 lg:border-t lg:pt-5">
        {children}
      </div>
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
