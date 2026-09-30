"use client";

import { useEffect, useRef } from "react";

import { Button, Textarea } from "@/components/common/control";
import { FormField } from "@/components/common/form";

interface PropTypes {
  value: string;
  error?: string;
  isBusy: boolean;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  onDismiss: () => void;
}

export const CancelPanel = (props: PropTypes) => {
  const { value, error, isBusy, onValueChange, onSubmit, onDismiss } = props;

  const fieldRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fieldRef.current?.focus();
  }, []);

  return (
    <section
      aria-label="Batalkan kas keluar"
      className="border-border space-y-3 rounded-control border p-3"
    >
      <FormField
        htmlFor="cancelReason"
        label="Alasan pembatalan"
        error={error}
        hint="Alasan ini tersimpan di buku dan tidak bisa diubah lagi."
      >
        <Textarea
          ref={fieldRef}
          id="cancelReason"
          name="cancelReason"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          maxLength={250}
          rows={2}
          disabled={isBusy}
          placeholder="Mis. nota ganda, sudah dibayar lewat kas kecil"
        />
      </FormField>

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isBusy}
          onClick={onDismiss}
        >
          Jangan batalkan
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={isBusy}
          onClick={onSubmit}
        >
          {isBusy ? "Membatalkan…" : "Lanjutkan pembatalan"}
        </Button>
      </div>
    </section>
  );
};
