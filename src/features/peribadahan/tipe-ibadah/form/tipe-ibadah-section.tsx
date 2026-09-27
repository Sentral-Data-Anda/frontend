"use client";

import { Input, SelectField, optionsOf } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";

import { TIPE_IBADAH_STATUS_LABEL } from "../types";

import { type TipeIbadahForm } from "./form-options";

const STATUS_OPTIONS = optionsOf(TIPE_IBADAH_STATUS_LABEL);

interface PropTypes {
  form: TipeIbadahForm;
  isDisabled: boolean;
}

export const TipeIbadahSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  return (
    <FormSection legend="Tipe ibadah" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="name"
        label="Nama"
        hint="Mis. Ibadah Minggu Pagi."
      >
        {(field) => <Input {...field} maxLength={50} autoCapitalize="words" />}
      </ControlField>

      <ControlField
        control={form.control}
        name="isActive"
        label="Status"
        hint="Tipe nonaktif tidak bisa dipilih untuk ibadah baru; ibadah yang sudah tercatat tetap memakainya."
      >
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={STATUS_OPTIONS}
            disabled={isDisabled}
            placeholder="Pilih status"
          />
        )}
      </ControlField>
    </FormSection>
  );
};
