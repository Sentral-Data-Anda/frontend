import { Banknote } from "lucide-react";

import { Badge } from "./badge";

/**
 * Penanda yang MENETAP di Kontrak Karyawan dan Penggajian (SDM \u00a70.3 no. 8).
 * Bukan modal, bukan konfirmasi, tidak bisa ditutup: tugasnya membuat orang
 * berpikir sebelum memproyeksikan layar atau membagikan tab.
 *
 * Teksnya tetap dan tidak jadi prop. Dua layar memakainya dengan kata yang
 * sama persis, dan penanda yang tiap layar menamainya sendiri berhenti jadi
 * penanda.
 */
export const SalaryDataBadge = () => (
  <Badge variant="warning" className="gap-1">
    <Banknote aria-hidden className="size-3.5 shrink-0" />
    Data gaji
    <span className="sr-only">
      \u2014 nominal per orang. Jangan dibagikan atau diproyeksikan.
    </span>
  </Badge>
);
