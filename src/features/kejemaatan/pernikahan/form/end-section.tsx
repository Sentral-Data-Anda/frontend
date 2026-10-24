"use client";

import { useWatch } from "react-hook-form";

import {
  DateField,
  SelectField,
  Textarea,
  optionsOf,
} from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";

import { DECEASED_SIDE_LABEL, END_REASON_LABEL } from "../types";

import { type EndMarriageForm } from "./form-options";

const END_REASON_OPTIONS = optionsOf(END_REASON_LABEL);
const DECEASED_SIDE_OPTIONS = optionsOf(DECEASED_SIDE_LABEL);

interface PropTypes {
  form: EndMarriageForm;
  isDisabled: boolean;
}

export const EndSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const endReason = useWatch({ control: form.control, name: "endReason" });

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

      {endReason === "CERAI_MATI" ? (
        <ControlField
          control={form.control}
          name="deceased"
          label="Yang meninggal"
          hint="Keanggotaan keluarga orang ini ikut ditutup."
        >
          {(field) => (
            <SelectField
              value={field.value}
              onValueChange={field.onChange}
              options={DECEASED_SIDE_OPTIONS}
              disabled={isDisabled}
              placeholder="Pilih suami atau istri"
            />
          )}
        </ControlField>
      ) : null}

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
