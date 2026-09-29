"use client";

import { Controller } from "react-hook-form";

import { AttachmentField } from "@/components/common/control";
import { FormSection, FormWide } from "@/components/common/form";

import { MAX_ATTACHMENTS } from "../model";

import type { RequestForm } from "./form-options";

const HINT = "Foto atau PDF penawaran toko, bila ada. Membantu penanda tangan.";

interface PropTypes {
  form: RequestForm;
  isDisabled: boolean;
  copiedFrom?: string;
}

export const QuoteSection = (props: PropTypes) => {
  const { form, isDisabled, copiedFrom } = props;

  return (
    <FormSection legend="Penawaran" disabled={isDisabled}>
      <FormWide>
        <Controller
          control={form.control}
          name="attachments"
          render={({ field, fieldState }) => (
            <AttachmentField
              id="attachments"
              label="Foto atau PDF penawaran"
              isLabelVisible={false}
              value={field.value}
              onValueChange={field.onChange}
              max={MAX_ATTACHMENTS}
              accept="image-pdf"
              addLabel="Tambah penawaran"
              hint={
                copiedFrom
                  ? `${HINT} Lampiran permintaan ${copiedFrom} tidak ikut disalin.`
                  : HINT
              }
              error={fieldState.error?.message}
              disabled={isDisabled}
            />
          )}
        />
      </FormWide>
    </FormSection>
  );
};
