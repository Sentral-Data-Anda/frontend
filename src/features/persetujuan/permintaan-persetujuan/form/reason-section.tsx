"use client";

import { Textarea } from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";

import { REJECT_HINT } from "../model";

import { type RejectForm } from "./form-options";

interface PropTypes {
  form: RejectForm;
  isDisabled: boolean;
}

export const ReasonSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  return (
    <FormSection legend="Alasan" disabled={isDisabled}>
      <FormWide>
        <ControlField
          control={form.control}
          name="note"
          label="Alasan penolakan"
          hint={REJECT_HINT}
        >
          {(field) => <Textarea {...field} rows={4} maxLength={250} />}
        </ControlField>
      </FormWide>
    </FormSection>
  );
};
