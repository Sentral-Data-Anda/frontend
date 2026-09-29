"use client";

import { Input } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";

import { digitsOf } from "../model";

import type { SupplierForm } from "./form-options";

interface PropTypes {
  form: SupplierForm;
  isDisabled: boolean;
}

export const BankSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  return (
    <FormSection
      legend="Rekening bank"
      note="Untuk transfer pembayaran lewat Kas Keluar. Boleh dikosongkan."
      disabled={isDisabled}
    >
      <ControlField control={form.control} name="bankName" label="Nama bank">
        {(field) => (
          <Input
            {...field}
            maxLength={50}
            autoComplete="off"
            placeholder="mis. BCA"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="bankAccountNumber"
        label="No rekening"
      >
        {(field) => (
          <Input
            {...field}
            onChange={(event) =>
              field.onChange(digitsOf(event.target.value, 30))
            }
            inputMode="numeric"
            autoComplete="off"
            className="tabular-nums"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="bankAccountName"
        label="Nama pemilik rekening"
      >
        {(field) => <Input {...field} maxLength={100} autoComplete="off" />}
      </ControlField>
    </FormSection>
  );
};
