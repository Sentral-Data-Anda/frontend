"use client";

import { Input } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";

import { toCurrencyCode } from "../model";

import { type CurrencyForm } from "./form-options";

interface PropTypes {
  form: CurrencyForm;
  isDisabled: boolean;
  isEdit: boolean;
}

export const CurrencySection = (props: PropTypes) => {
  const { form, isDisabled, isEdit } = props;

  return (
    <FormSection legend="Mata uang" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="code"
        label="Kode"
        hint={
          isEdit
            ? "Kode tidak bisa diubah sesudah disimpan."
            : "Kode ISO 3 huruf, mis. USD atau SGD."
        }
      >
        {(field) => (
          <Input
            {...field}
            onChange={(event) =>
              field.onChange(toCurrencyCode(event.target.value))
            }
            disabled={isEdit || isDisabled}
            maxLength={3}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            placeholder="mis. USD"
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="name" label="Nama">
        {(field) => (
          <Input
            {...field}
            maxLength={50}
            autoCapitalize="words"
            placeholder="mis. Dolar Amerika"
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="symbol" label="Simbol">
        {(field) => (
          <Input
            {...field}
            maxLength={5}
            autoComplete="off"
            placeholder="mis. US$"
          />
        )}
      </ControlField>
    </FormSection>
  );
};
