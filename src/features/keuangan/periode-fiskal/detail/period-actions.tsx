"use client";

import { Button } from "@/components/common/control";

import { CLOSE_NOTE } from "../model";
import type { FiscalPeriodDetail } from "../types";

interface PropTypes {
  period: Pick<FiscalPeriodDetail, "status">;
  isPending: boolean;
  onCloseBook: () => void;
  onReopen: () => void;
}

export const PeriodActions = (props: PropTypes) => {
  const { period, isPending, onCloseBook, onReopen } = props;

  const isOpen = period.status === "OPEN";

  return (
    <section
      aria-label="Tindakan periode"
      className="flex flex-wrap items-center justify-end gap-3 px-gutter pt-4"
    >
      <p className="text-muted-foreground min-w-0 flex-[1_1_16rem] text-body">
        {isOpen
          ? CLOSE_NOTE
          : "Buku bulan ini tertutup. Membukanya lagi mengizinkan entri jurnal masuk ke bulan ini."}
      </p>

      {isOpen ? (
        <Button type="button" disabled={isPending} onClick={onCloseBook}>
          {isPending ? "Menutup…" : "Tutup buku"}
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={onReopen}
        >
          Buka kembali
        </Button>
      )}
    </section>
  );
};
