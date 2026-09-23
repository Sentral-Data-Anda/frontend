import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Tanggal kalender, memakai `<input type="date">` bawaan peramban.
 *
 * Tanpa pustaka tanggal dan tanpa kalender bikinan sendiri, karena yang bawaan
 * sudah benar di tempat yang paling sulit ditiru: papan ketik tanggal di
 * Android/iOS, urutan hari-bulan mengikuti setelan perangkat, dan navigasi
 * keyboard per bagian. Nilainya `YYYY-MM-DD` — persis yang diminta be-sada,
 * jadi tidak ada konversi zona waktu yang bisa menggeser tanggal lahir sehari.
 *
 * Yang ditambahkan di sini hanya dua hal yang tidak dilakukan peramban:
 * kursor `pointer` pada ikon kalender (bawaannya `default`, sehingga bagian
 * yang paling sering diklik justru tidak terlihat bisa diklik), dan lebar
 * penuh yang sama dengan kontrol lain — Safari menyusutkan input tanggal ke
 * lebar isinya.
 */
export function DateField({
  className,
  ...props
}: ComponentProps<typeof Input>) {
  return (
    <Input
      type="date"
      className={cn(
        "block cursor-text [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-date-and-time-value]:text-left",
        className,
      )}
      {...props}
    />
  );
}
