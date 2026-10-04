"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Textarea } from "@/components/common/control";
import { ControlField } from "@/components/common/form";
import { ConfirmDialog } from "@/components/common/overlay";
import { applyServerError } from "@/lib/form-error";

import { useCancelProgram } from "../api";
import { CANCEL_HINT, cancelDialogText } from "../model";

const cancelSchema = z.object({
  cancelReason: z
    .string()
    .trim()
    .min(1, "Isi alasan pembatalan")
    .max(250, "Alasan maksimal 250 karakter"),
});

type CancelValues = z.infer<typeof cancelSchema>;

interface PropTypes {
  publicId: string;
  heldAmount: string;
  isOpen: boolean;
  onClose: () => void;
  onCancelled: (message: string) => void;
}

export const CancelDialog = (props: PropTypes) => {
  const { publicId, heldAmount, isOpen, onClose, onCancelled } = props;

  const cancel = useCancelProgram(publicId);
  const form = useForm<CancelValues>({
    resolver: zodResolver(cancelSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { cancelReason: "" },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const saved = await cancel.mutateAsync({
        cancelReason: values.cancelReason.trim(),
      });

      form.reset();
      onCancelled(saved.message);
    } catch (error) {
      applyServerError(error, form.setError);
      form.setFocus("cancelReason");
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
      title="Batalkan usulan"
      description={cancelDialogText(heldAmount)}
      confirmLabel={isSubmitting ? "Membatalkan…" : "Batalkan usulan"}
      isPending={isSubmitting}
      isClosedOnConfirm={false}
      onConfirm={() => void onSubmit()}
    >
      <form noValidate onSubmit={(event) => event.preventDefault()}>
        <ControlField
          control={form.control}
          name="cancelReason"
          label="Alasan"
          hint={CANCEL_HINT}
        >
          {(field) => (
            <Textarea
              {...field}
              maxLength={250}
              disabled={isSubmitting}
              placeholder="mis. Retret ditunda ke tahun pelayanan berikutnya"
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
