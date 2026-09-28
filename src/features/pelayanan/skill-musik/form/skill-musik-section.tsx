"use client";

import { Input } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";

import { type SkillMusikForm } from "./form-options";

interface PropTypes {
  form: SkillMusikForm;
  isDisabled: boolean;
}

export const SkillMusikSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  return (
    <FormSection legend="Alat musik" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="name"
        label="Nama alat"
        hint="Mis. Keyboard, Gitar, Bass, Drum."
      >
        {(field) => <Input {...field} maxLength={50} autoCapitalize="words" />}
      </ControlField>
    </FormSection>
  );
};
