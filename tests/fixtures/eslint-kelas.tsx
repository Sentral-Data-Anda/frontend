/* eslint-disable */
// Berkas ini SENGAJA melanggar, pasangan eslint-konvensi.tsx untuk aturan
// kelas Tailwind di layar. Jalankan:
//
//   bunx eslint --no-inline-config tests/fixtures/eslint-kelas.tsx
//
// Harus melaporkan SEMUA baris bertanda "← lapor" — termasuk useState(false),
// yang membuktikan aturan penamaan tidak tertimpa oleh blok aturan kelas.
import { useState } from "react";

import { cn } from "@/lib/utils";

export function Pelanggar({ isWide }: { isWide: boolean }) {
  const [isOpen, setIsOpen] = useState(false); // ← lapor (penamaan)

  return (
    <div
      onClick={() => setIsOpen(!isOpen)}
      className="flex md:grid lg:grid-cols-2" // ← lapor (breakpoint)
    >
      <p className={cn("p-4", isWide && "hover:sm:p-6")} /> {/* ← lapor */}
      <p className={`p-2 @md:p-4`} /> {/* ← lapor (container query) */}
      <p className="max-md:hidden" /> {/* ← lapor */}
      <p className="min-[600px]:flex" /> {/* ← lapor */}
      <p className="bg-white text-gray-500" /> {/* ← lapor (palet) */}
      <p className="border-t-red-500/50" /> {/* ← lapor (palet) */}
      <p className="text-[#364f6b]" /> {/* ← lapor (arbitrer) */}
      <p className="bg-primary-50 text-failed-700" /> {/* ← lapor (skala) */}
      <p className="font-bold" /> {/* ← lapor (bobot 700) */}
      <p className="dark:bg-muted" /> {/* ← lapor (dark) */}
      <p className="text-2xl" /> {/* ← lapor (ukuran teks) */}
      <p className="text-sm/6" /> {/* ← lapor (ukuran teks) */}
      <p className="text-[18px]" /> {/* ← lapor (ukuran teks) */}
      {/* Tidak boleh dilapor: token, min-h arbitrer, kata yang mirip. */}
      <p className="bg-primary text-muted-foreground min-h-[60vh] border-input text-title text-body text-caption text-balance" />
    </div>
  );
}
