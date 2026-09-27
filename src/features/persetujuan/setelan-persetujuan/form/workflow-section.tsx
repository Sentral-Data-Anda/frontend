"use client";

import { useWatch } from "react-hook-form";

import { Input, SelectField, optionsOf } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";

import { documentOptionsFor } from "../model";
import { SETELAN_STATUS_LABEL } from "../types";

import type { SetelanForm } from "./form-options";

const STATUS_OPTIONS = optionsOf(SETELAN_STATUS_LABEL);

interface PropTypes {
  form: SetelanForm;
  isDisabled: boolean;
}

export const WorkflowSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const documentType = useWatch({
    control: form.control,
    name: "documentType",
  });

  return (
    <FormSection legend="Alur" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="name"
        label="Nama alur"
        hint="Mis. Kas keluar sampai Rp 5 juta."
      >
        {(field) => <Input {...field} maxLength={100} />}
      </ControlField>

      <ControlField
        control={form.control}
        name="documentType"
        label="Jenis dokumen"
      >
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={documentOptionsFor(documentType)}
            disabled={isDisabled}
            placeholder="Pilih jenis dokumen"
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="isActive" label="Status">
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
