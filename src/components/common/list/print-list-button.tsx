"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/common/control";

interface PropTypes {
  isPending: boolean;
  onPrint: () => void;
}

/**
 * Memicu cetak daftar penuh. Terpisah dari {@link PrintSheet} karena tombolnya
 * duduk di header halaman, yang disembunyikan saat mencetak.
 */
export const PrintListButton = (props: PropTypes) => {
  const { isPending, onPrint } = props;

  return (
    <Button
      type="button"
      variant="outline"
      className="cursor-pointer"
      isLoading={isPending}
      onClick={onPrint}
    >
      <Printer aria-hidden />
      {isPending ? "Menyiapkan…" : "Cetak"}
    </Button>
  );
};
