"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Textarea } from "@/components/common/control";
import { ControlField } from "@/components/common/form";
import { ConfirmDialog } from "@/components/common/overlay";
import { applyServerError } from "@/lib/form-error";

import { useWaiveGate } from "../api";
import { waiveSchema, waiveText, type WaiveValues } from "../model";

interface PropTypes {
  bapelId: number;
  bapelName: string;
  year: number;
  month: number;
  label: string;
  isOpen: boolean;
  onClose: () => void;
  onWaived: () => void;
}

export const WaiveDialog = (props: PropTypes) => {
  const { bapelId, bapelName, year, month, label, isOpen, onClose, onWaived } =
    props;

  const waive = useWaiveGate();
  const form = useForm<WaiveValues>({
    resolver: zodResolver(waiveSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { reason: "" },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await waive.mutateAsync({
        bapelId,
        year,
        month,
        reason: values.reason.trim(),
      });

      form.reset();
      onWaived();
    } catch (error) {
      applyServerError(error, form.setError);
      form.setFocus("reason");
    }
  });

  const onOpenChange = (isNextOpen: boolean) => {
    if (isNextOpen || isSubmitting) return;

    form.reset();
    onClose();
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Bebaskan pencairan"
      description={waiveText(bapelName, label)}
      confirmLabel={isSubmitting ? "Membebaskan…" : "Bebaskan"}
      isPending={isSubmitting}
      isClosedOnConfirm={false}
      onConfirm={() => void onSubmit()}
    >
      <form noValidate onSubmit={(event) => event.preventDefault()}>
        <ControlField
          control={form.control}
          name="reason"
          label="Alasan"
          hint="Alasan ini tersimpan dan terlihat di laporan badan pelayanan."
        >
          {(field) => (
            <Textarea
              {...field}
              maxLength={250}
              disabled={isSubmitting}
              placeholder="mis. Pengurus baru dilantik 10 Agustus; penanda tangan lama pindah gereja"
            />
          )}
        </ControlField>

        {errors.root ? (
          <p role="alert" className="text-destructive mt-2 text-body">
            {errors.root.message}
          </p>
        ) : null}
      </form>
    </ConfirmDialog>
  );
};
