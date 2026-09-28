"use client";

import { Button } from "@/components/common/control";
import { FormAlert } from "@/components/common/form";

interface PropTypes {
  isWithdrawing: boolean;
  error: string | null;
  onWithdraw: () => void;
}

export const WithdrawAction = (props: PropTypes) => {
  const { isWithdrawing, error, onWithdraw } = props;

  return (
    <section aria-label="Tarik pengajuan" className="space-y-3 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-body">
          Menarik pengajuan mengembalikan barang ke status aktif.
        </p>
        <Button
          type="button"
          variant="destructive"
          disabled={isWithdrawing}
          onClick={onWithdraw}
        >
          {isWithdrawing ? "Menarik…" : "Tarik pengajuan"}
        </Button>
      </div>

      {error ? (
        <FormAlert title="Pengajuan belum ditarik." message={error} />
      ) : null}
    </section>
  );
};
