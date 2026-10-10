"use client";

import { Button } from "@/components/common/control";
import { FormAlert } from "@/components/common/form";

interface PropTypes {
  reason: string | null;
  isCanDelete: boolean;
  isCancelling: boolean;
  error: string | null;
  onCancel: () => void;
}

export const CancelAction = (props: PropTypes) => {
  const { reason, isCanDelete, isCancelling, error, onCancel } = props;

  if (!reason && !isCanDelete) return null;

  return (
    <section aria-label="Pembatalan" className="space-y-3 pt-4">
      {reason ? (
        <p className="text-muted-foreground text-body">{reason}</p>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-body">
            Membatalkan mengembalikan kursinya ke event.
          </p>
          <Button
            type="button"
            variant="destructive"
            disabled={isCancelling}
            onClick={onCancel}
            isLoading={isCancelling}
          >
            {isCancelling ? "Membatalkan…" : "Batalkan pendaftaran"}
          </Button>
        </div>
      )}

      {error ? (
        <FormAlert title="Pendaftaran belum dibatalkan." message={error} />
      ) : null}
    </section>
  );
};
