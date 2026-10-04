"use client";

import { Controller } from "react-hook-form";

import { AttachmentField } from "@/components/common/control";
import { FormSection, FormWide } from "@/components/common/form";

import { MAX_RECEIPTS, RECEIPT_NOTE, RECEIPT_PRIVACY } from "../model";

import type { ReportForm } from "./form-options";

interface PropTypes {
  form: ReportForm;
  isDisabled: boolean;
}

export const ReceiptSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  return (
    <FormSection legend="Kwitansi" note={RECEIPT_PRIVACY} disabled={isDisabled}>
      <FormWide>
        <Controller
          control={form.control}
          name="receipts"
          render={({ field, fieldState }) => (
            <AttachmentField
              id="receipts"
              label="Foto atau PDF kwitansi"
              isLabelVisible={false}
              value={field.value}
              onValueChange={field.onChange}
              max={MAX_RECEIPTS}
              accept="image-pdf"
              addLabel="Tambah kwitansi"
              hint={RECEIPT_NOTE}
              error={fieldState.error?.message}
              disabled={isDisabled}
            />
          )}
        />
      </FormWide>
    </FormSection>
  );
};
