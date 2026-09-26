"use client";

import {
  DateField,
  SelectField,
  Textarea,
  optionsOf,
} from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";

import { END_REASON_LABEL } from "../types";

import { type EndMarriageForm } from "./form-options";

const END_REASON_OPTIONS = optionsOf(END_REASON_LABEL);

interface PropTypes {
  form: EndMarriageForm;
  isDisabled: boolean;
}

export const EndSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  return (
    <FormSection
      legend="Akhir pernikahan"
      note="Pernikahan yang diakhiri tetap tersimpan sebagai riwayat."
      disabled={isDisabled}
    >
      <ControlField
        control={form.control}
        name="endedAt"
        label="Tanggal berakhir"
      >
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={field.disabled}
            label="Tanggal berakhir"
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="endReason" label="Alasan">
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={END_REASON_OPTIONS}
            disabled={isDisabled}
            placeholder="Pilih alasan"
          />
        )}
      </ControlField>

      <FormWide>
        <ControlField
          control={form.control}
          name="endNote"
          label="Catatan"
          isOptional
        >
          {(field) => <Textarea {...field} maxLength={250} />}
        </ControlField>
      </FormWide>
    </FormSection>
  );
};
