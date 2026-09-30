"use client";

import { Controller } from "react-hook-form";

import { AttachmentField } from "@/components/common/control";
import { FormSection, FormWide } from "@/components/common/form";

import { MAX_NOTES, NOTE_HINT } from "../model";

import type { ExpenseForm } from "./form-options";

interface PropTypes {
  form: ExpenseForm;
  isDisabled: boolean;
}

export const NoteSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  return (
    <FormSection legend="Nota" disabled={isDisabled}>
      <FormWide>
        <Controller
          control={form.control}
          name="attachments"
          render={({ field, fieldState }) => (
            <AttachmentField
              id="attachments"
              label="Foto atau PDF nota"
              isLabelVisible={false}
              value={field.value}
              onValueChange={field.onChange}
              max={MAX_NOTES}
              accept="image-pdf"
              addLabel="Tambah nota"
              hint={NOTE_HINT}
              error={fieldState.error?.message}
              disabled={isDisabled}
            />
          )}
        />
      </FormWide>
    </FormSection>
  );
};
