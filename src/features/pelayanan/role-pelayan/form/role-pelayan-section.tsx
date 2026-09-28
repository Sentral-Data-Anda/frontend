"use client";

import { Input } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";

import { type RolePelayanForm } from "./form-options";

interface PropTypes {
  form: RolePelayanForm;
  isDisabled: boolean;
  isLocked: boolean;
}

export const RolePelayanSection = (props: PropTypes) => {
  const { form, isDisabled, isLocked } = props;

  return (
    <FormSection legend="Role pelayan" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="name"
        label="Nama tugas"
        hint={
          isLocked
            ? "Nama ini dipakai sistem untuk memilih pemain per alat musik di Jadwal Pelayan, jadi tidak bisa diubah."
            : "Mis. Liturgis, Pemusik, Penerima Tamu."
        }
      >
        {(field) => (
          <Input
            {...field}
            maxLength={50}
            autoCapitalize="words"
            readOnly={isLocked}
          />
        )}
      </ControlField>
    </FormSection>
  );
};
