"use client";

import { AmountInput, DateField } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";
import { todayJakarta } from "@/lib/date";

import { type RateForm } from "./form-options";

interface PropTypes {
  form: RateForm;
  currencyCode: string;
  isDisabled: boolean;
  isEdit: boolean;
}

export const RateSection = (props: PropTypes) => {
  const { form, currencyCode, isDisabled, isEdit } = props;

  return (
    <FormSection legend="Kurs" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="rateDate"
        label="Tanggal kurs"
        hint={
          isEdit
            ? "Tanggal tidak bisa diubah. Hapus kurs ini lalu tambah yang baru bila tanggalnya salah."
            : undefined
        }
      >
        {(field) => (
          <DateField
            id={field.name}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isEdit || isDisabled}
            max={todayJakarta()}
            label="Tanggal kurs"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="rate"
        label={`Kurs (Rp per 1 ${currencyCode})`}
        hint="Pakai koma untuk desimal, mis. 15.800,5"
      >
        {(field) => (
          <AmountInput
            id={field.name}
            ref={field.ref}
            name={field.name}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            maxDigits={12}
            maxFraction={6}
            placeholder="mis. 15.800"
          />
        )}
      </ControlField>
    </FormSection>
  );
};
