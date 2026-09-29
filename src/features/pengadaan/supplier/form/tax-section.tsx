"use client";

import { Input } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";

import type { SupplierForm } from "./form-options";

interface PropTypes {
  form: SupplierForm;
  isDisabled: boolean;
}

export const TaxSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  return (
    <FormSection legend="Pajak" note="Boleh dikosongkan." disabled={isDisabled}>
      <ControlField control={form.control} name="npwp" label="NPWP">
        {(field) => (
          <Input
            {...field}
            maxLength={25}
            autoComplete="off"
            placeholder="mis. 01.234.567.8-121.000"
            className="tabular-nums"
          />
        )}
      </ControlField>
    </FormSection>
  );
};
