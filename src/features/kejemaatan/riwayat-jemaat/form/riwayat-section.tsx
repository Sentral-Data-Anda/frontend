"use client";

import {
  DateField,
  Input,
  SelectField,
  optionsOf,
} from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";

import { SACRAMENT_TYPE_LABEL } from "../types";

import type { RiwayatForm } from "./form-options";

const TYPE_OPTIONS = optionsOf(SACRAMENT_TYPE_LABEL);

interface PropTypes {
  form: RiwayatForm;
  isDisabled: boolean;
}

export const RiwayatSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  return (
    <FormSection legend="Riwayat" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="type"
        label="Jenis"
        hint="Meninggal dan atestasi keluar menjadikan jemaat tidak aktif."
      >
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={TYPE_OPTIONS}
            disabled={isDisabled}
            placeholder="Pilih jenis"
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="date" label="Tanggal">
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            label="Tanggal riwayat"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="certificateNumber"
        label="Nomor surat"
        isOptional
      >
        {(field) => <Input {...field} maxLength={50} />}
      </ControlField>

      <ControlField
        control={form.control}
        name="place"
        label="Tempat"
        isOptional
        hint="Untuk atestasi masuk: nama gereja asal."
      >
        {(field) => <Input {...field} maxLength={100} />}
      </ControlField>
    </FormSection>
  );
};
