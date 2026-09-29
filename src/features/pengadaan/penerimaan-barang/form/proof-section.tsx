"use client";

import { Controller } from "react-hook-form";

import { AttachmentField } from "@/components/common/control";
import { FormSection, FormWide } from "@/components/common/form";

import { MAX_ATTACHMENTS } from "../model";

import type { ReceiptForm } from "./form-options";

interface PropTypes {
  form: ReceiptForm;
  isDisabled: boolean;
}

export const ProofSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  return (
    <FormSection
      legend="Nota / surat jalan"
      note={`Opsional. Foto atau PDF nota dan surat jalan, maksimal ${MAX_ATTACHMENTS} berkas.`}
      disabled={isDisabled}
    >
      <FormWide>
        <Controller
          control={form.control}
          name="image"
          render={({ field, fieldState }) => (
            <AttachmentField
              id="image"
              label="Nota / surat jalan"
              isLabelVisible={false}
              value={field.value}
              onValueChange={field.onChange}
              max={MAX_ATTACHMENTS}
              accept="image-pdf"
              addLabel="Tambah nota"
              error={fieldState.error?.message}
              disabled={isDisabled}
            />
          )}
        />
      </FormWide>
    </FormSection>
  );
};
