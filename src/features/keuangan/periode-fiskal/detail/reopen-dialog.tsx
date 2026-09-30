"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Textarea } from "@/components/common/control";
import { ControlField } from "@/components/common/form";
import { ConfirmDialog } from "@/components/common/overlay";
import { applyServerError } from "@/lib/form-error";

import { useReopenPeriod } from "../api";
import { reopenSchema, reopenText, type ReopenValues } from "../model";

interface PropTypes {
  id: string;
  label: string;
  isOpen: boolean;
  onClose: () => void;
  onReopened: () => void;
}

export const ReopenDialog = (props: PropTypes) => {
  const { id, label, isOpen, onClose, onReopened } = props;

  const reopen = useReopenPeriod(id);
  const form = useForm<ReopenValues>({
    resolver: zodResolver(reopenSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { reopenReason: "" },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await reopen.mutateAsync({ reopenReason: values.reopenReason.trim() });

      form.reset();
      onReopened();
    } catch (error) {
      applyServerError(error, form.setError);
      form.setFocus("reopenReason");
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
      title="Buka kembali buku"
      description={reopenText(label)}
      confirmLabel={isSubmitting ? "Membuka…" : "Buka kembali"}
      isPending={isSubmitting}
      isClosedOnConfirm={false}
      onConfirm={() => void onSubmit()}
    >
      <form noValidate onSubmit={(event) => event.preventDefault()}>
        <ControlField
          control={form.control}
          name="reopenReason"
          label="Alasan"
          hint="Alasan ini tersimpan sebagai jejak audit."
        >
          {(field) => (
            <Textarea
              {...field}
              maxLength={250}
              disabled={isSubmitting}
              placeholder="mis. Koreksi kolekte yang tertukar tipenya"
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
