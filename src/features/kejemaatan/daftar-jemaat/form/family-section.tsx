"use client";

import { useWatch } from "react-hook-form";

import { ComboboxField, SelectField } from "@/components/common/control";
import { FormSection } from "@/components/common/form";

import { useKeluargaOptions } from "../api";
import { ROLE_IN_FAMILY_LABEL } from "../types";

import { ControlField } from "./control-field";
import { type JemaatForm, optionsOf } from "./section";

const ROLE_OPTIONS = optionsOf(ROLE_IN_FAMILY_LABEL);

interface PropTypes {
  form: JemaatForm;
  isDisabled: boolean;
}

export const FamilySection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const keluargaId = useWatch({ control: form.control, name: "keluargaId" });
  const keluarga = useKeluargaOptions();

  return (
    <FormSection
      legend="Keluarga"
      note="Boleh dilewati — banyak jemaat tinggal sendiri atau kos. Peran wajib diisi begitu keluarganya dipilih."
      disabled={isDisabled}
    >
      <ControlField control={form.control} name="keluargaId" label="Keluarga">
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={(value) => {
              field.onChange(value);
              if (!value) {
                form.setValue("roleInFamily", "", { shouldDirty: true });
              }
            }}
            options={keluarga.options}
            isLoading={keluarga.isLoading}
            onSearch={keluarga.onSearch}
            isClearable
            disabled={isDisabled}
            placeholder="Pilih keluarga"
            emptyMessage="Belum ada data keluarga"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="roleInFamily"
        label="Peran dalam keluarga"
      >
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={ROLE_OPTIONS}
            disabled={isDisabled || !keluargaId}
            placeholder={
              keluargaId ? "Pilih peran dalam keluarga" : "Pilih keluarga dulu"
            }
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="keluargaAsalId"
        label="Keluarga asal"
        hint="Untuk menelusuri anak yang kini berkeluarga sendiri."
      >
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={field.onChange}
            options={keluarga.options}
            isLoading={keluarga.isLoading}
            onSearch={keluarga.onSearch}
            isClearable
            disabled={isDisabled}
            placeholder="Pilih keluarga asal"
            emptyMessage="Belum ada data keluarga"
          />
        )}
      </ControlField>
    </FormSection>
  );
};
