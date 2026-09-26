"use client";

import {
  ComboboxField,
  Input,
  SelectField,
  type SelectOption,
} from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";

import { useBapelOptions, useJemaatOptions } from "../api";

import { type RoleJemaatForm } from "./form-options";

const SELECT_LIMIT = 15;

interface PropTypes {
  form: RoleJemaatForm;
  isDisabled: boolean;
  savedJemaat?: SelectOption;
}

export const JabatanSection = (props: PropTypes) => {
  const { form, isDisabled, savedJemaat } = props;

  const jemaat = useJemaatOptions();
  const bapel = useBapelOptions();

  const jemaatOptions =
    savedJemaat &&
    !jemaat.options.some((option) => option.value === savedJemaat.value)
      ? [savedJemaat, ...jemaat.options]
      : jemaat.options;

  return (
    <FormSection legend="Jabatan" disabled={isDisabled}>
      <ControlField control={form.control} name="jemaatId" label="Jemaat">
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={field.onChange}
            options={jemaatOptions}
            isLoading={jemaat.isLoading}
            onSearch={jemaat.onSearch}
            disabled={isDisabled}
            placeholder="Ketik nama jemaat"
            emptyMessage="Tidak ada jemaat dengan nama itu"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="bapelId"
        label="Badan pelayanan"
      >
        {(field) =>
          bapel.options.length > SELECT_LIMIT ? (
            <ComboboxField
              value={field.value}
              onValueChange={field.onChange}
              options={bapel.options}
              isLoading={bapel.isLoading}
              disabled={isDisabled}
              placeholder="Pilih badan pelayanan"
              emptyMessage="Belum ada data badan pelayanan"
            />
          ) : (
            <SelectField
              value={field.value}
              onValueChange={field.onChange}
              options={bapel.options}
              disabled={isDisabled}
              placeholder={
                bapel.isLoading ? "Memuat…" : "Pilih badan pelayanan"
              }
              emptyMessage="Belum ada data badan pelayanan"
            />
          )
        }
      </ControlField>

      <ControlField
        control={form.control}
        name="name"
        label="Nama jabatan"
        hint="Mis. Ketua, Sekretaris, atau Bendahara."
      >
        {(field) => <Input {...field} maxLength={50} autoCapitalize="words" />}
      </ControlField>
    </FormSection>
  );
};
