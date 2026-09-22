import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Skala teks kustom (`globals.css`) didaftarkan sebagai ukuran font. Tanpa
 * ini tailwind-merge menganggap `text-body` warna teks, lalu membuangnya
 * begitu ada `text-primary-foreground` sesudahnya — ukuran diam-diam jatuh
 * ke bawaan induk.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["lead", "title", "body", "caption"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
