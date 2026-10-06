"use client";

import { Lock } from "lucide-react";

import {
  ComboboxField,
  Input,
  type SelectOption,
} from "@/components/common/control";
import { ControlField, FormField, FormSection } from "@/components/common/form";

import { useJemaatOptions } from "../api";

import { type KaryawanForm } from "./form-options";

interface PropTypes {
  form: KaryawanForm;
  isDisabled: boolean;
  code?: string;
  pinned: SelectOption | null;
}

export const IdentitySection = (props: PropTypes) => {
  const { form, isDisabled, code, pinned } = props;

  const jemaat = useJemaatOptions(pinned);

  return (
    <FormSection legend="Identitas" disabled={isDisabled}>
      <ControlField control={form.control} name="name" label="Nama">
        {(field) => <Input {...field} maxLength={150} autoCapitalize="words" />}
      </ControlField>

      <ControlField
        control={form.control}
        name="jemaatId"
        label="Jemaat"
        hint="Isi bila karyawan ini juga jemaat gereja."
        isOptional
      >
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={field.onChange}
            options={jemaat.options}
            isLoading={jemaat.isLoading}
            onSearch={jemaat.onSearch}
            isClearable
            disabled={isDisabled}
            placeholder="Pilih jemaat"
            emptyMessage="Jemaat tidak ditemukan"
          />
        )}
      </ControlField>

      {code ? (
        <FormField
          htmlFor="code"
          label="Kode"
          hint="Dibuat otomatis dan tidak bisa diubah."
        >
          <Input
            readOnly
            variant="filled"
            value={code}
            icon={<Lock />}
            className="cursor-default"
          />
        </FormField>
      ) : null}
    </FormSection>
  );
};
