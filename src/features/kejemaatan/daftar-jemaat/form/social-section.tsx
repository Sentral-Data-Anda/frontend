"use client";

import { useWatch } from "react-hook-form";

import {
  ComboboxField,
  SelectField,
  type SelectOption,
} from "@/components/common/control";
import { FormSection } from "@/components/common/form";

import { useDdlOptions } from "../api";
import {
  BLOOD_TYPE_LABEL,
  LAST_EDUCATION_LABEL,
  STATUS_PERNIKAHAN_LABEL,
} from "../types";

import { ControlField } from "./control-field";
import { type JemaatForm, optionsOf } from "./section";

const MARITAL_OPTIONS = optionsOf(STATUS_PERNIKAHAN_LABEL);

const BLOOD_OPTIONS = optionsOf(BLOOD_TYPE_LABEL);

const EDUCATION_OPTIONS: SelectOption[] = [
  { value: "", label: "Tidak diketahui" },
  ...optionsOf(LAST_EDUCATION_LABEL),
];

interface PropTypes {
  form: JemaatForm;
  isDisabled: boolean;
}

export const SocialSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const isAnggota =
    useWatch({ control: form.control, name: "typeJemaat" }) === "ANGGOTA";
  const profession = useDdlOptions("profession");
  const ethnicGroup = useDdlOptions("ethnic-group");

  return (
    <FormSection
      legend="Data sosial"
      note={
        isAnggota
          ? "Dipakai untuk laporan gereja. Selain status pernikahan dan suku, semuanya boleh dikosongkan."
          : "Dipakai untuk laporan gereja. Semuanya boleh dikosongkan."
      }
      disabled={isDisabled}
    >
      <ControlField
        control={form.control}
        name="statusMarital"
        label="Status pernikahan"
      >
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={MARITAL_OPTIONS}
            disabled={isDisabled}
            placeholder="Pilih status pernikahan"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="professionId"
        label="Pekerjaan"
      >
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={field.onChange}
            options={profession.options}
            isLoading={profession.isLoading}
            isClearable
            disabled={isDisabled}
            placeholder="Pilih pekerjaan"
            emptyMessage="Belum ada data pekerjaan"
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="ethnicGroupId" label="Suku">
        {(field) => (
          <ComboboxField
            value={field.value}
            onValueChange={field.onChange}
            options={ethnicGroup.options}
            isLoading={ethnicGroup.isLoading}
            isClearable={!isAnggota}
            disabled={isDisabled}
            placeholder="Pilih suku"
            emptyMessage="Belum ada data suku"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="lastEducation"
        label="Pendidikan terakhir"
      >
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={EDUCATION_OPTIONS}
            disabled={isDisabled}
            placeholder="Pilih pendidikan terakhir"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="bloodType"
        label="Golongan darah"
      >
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={BLOOD_OPTIONS}
            disabled={isDisabled}
            placeholder="Pilih golongan darah"
          />
        )}
      </ControlField>
    </FormSection>
  );
};
