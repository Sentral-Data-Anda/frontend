"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { AccountField, AmountInput, Input } from "@/components/common/control";
import { ControlField } from "@/components/common/form";
import { ConfirmDialog } from "@/components/common/overlay";
import { applyServerError } from "@/lib/form-error";
import { formatAmount } from "@/lib/format";

import { useAddPayment } from "../api";
import {
  emptyPaymentForm,
  paymentSchema,
  toPaymentPayload,
  type PaymentValues,
} from "../model";

interface PropTypes {
  publicId: string;
  outstanding: string;
  isOpen: boolean;
  onClose: () => void;
  onPaid: () => void;
}

export const PaymentDialog = (props: PropTypes) => {
  const { publicId, outstanding, isOpen, onClose, onPaid } = props;

  const addPayment = useAddPayment(publicId);
  const form = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: emptyPaymentForm(outstanding),
  });
  const { errors, isSubmitting } = form.formState;

  // Sisa tagihan berubah setiap kali sebuah pembayaran masuk, jadi bawaannya
  // diisi ulang saat dialog dibuka — bukan sekali saat komponen lahir.
  useEffect(() => {
    if (isOpen) form.reset(emptyPaymentForm(outstanding));
  }, [isOpen, outstanding, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await addPayment.mutateAsync(toPaymentPayload(values));
      onPaid();
    } catch (error) {
      applyServerError(error, form.setError);
    }
  });

  const onOpenChange = (isNextOpen: boolean) => {
    if (isNextOpen || isSubmitting) return;

    onClose();
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Catat pembayaran"
      description={`Sisa tagihan ${formatAmount(outstanding)}. Pembayaran sebagian boleh, dan sisanya tetap tercatat.`}
      confirmLabel={isSubmitting ? "Menyimpan…" : "Simpan"}
      isPending={isSubmitting}
      isClosedOnConfirm={false}
      onConfirm={() => void onSubmit()}
    >
      <form
        noValidate
        className="space-y-3"
        onSubmit={(event) => event.preventDefault()}
      >
        <ControlField
          control={form.control}
          name="paymentDate"
          label="Tanggal pembayaran"
        >
          {(field) => <Input {...field} type="date" disabled={isSubmitting} />}
        </ControlField>

        <ControlField
          control={form.control}
          name="amountIDR"
          label="Nominal (Rp)"
        >
          {(field) => (
            <AmountInput
              value={field.value}
              onValueChange={field.onChange}
              disabled={isSubmitting}
              maxDigits={13}
              maxFraction={2}
            />
          )}
        </ControlField>

        <ControlField
          control={form.control}
          name="accountId"
          label="Dibayar dari akun"
        >
          {(field) => (
            <AccountField
              value={field.value}
              onValueChange={field.onChange}
              type="ASSET"
              disabled={isSubmitting}
              placeholder="Pilih kas atau bank"
            />
          )}
        </ControlField>

        <ControlField control={form.control} name="reference" label="Referensi">
          {(field) => (
            <Input
              {...field}
              maxLength={100}
              disabled={isSubmitting}
              placeholder="mis. nomor transfer"
            />
          )}
        </ControlField>

        {errors.root ? (
          <p role="alert" className="text-destructive text-body">
            {errors.root.message}
          </p>
        ) : null}
      </form>
    </ConfirmDialog>
  );
};
