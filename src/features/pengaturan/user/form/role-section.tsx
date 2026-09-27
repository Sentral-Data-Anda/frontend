"use client";

import { SelectField, type SelectOption } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";

import { type UserForm } from "./form-options";

interface PropTypes {
  form: UserForm;
  options: SelectOption[];
  isLoading: boolean;
  isDisabled: boolean;
  hint?: string;
}

export const RoleSection = (props: PropTypes) => {
  const { form, options, isLoading, isDisabled, hint } = props;

  return (
    <FormSection legend="Hak akses" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="roleUserId"
        label="Role"
        hint={hint}
      >
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={options}
            disabled={isDisabled}
            placeholder={isLoading ? "Memuat…" : "Pilih role"}
            emptyMessage="Tidak ada role yang boleh Anda berikan"
          />
        )}
      </ControlField>
    </FormSection>
  );
};
