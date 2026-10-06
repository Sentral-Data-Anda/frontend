"use client";

import { BapelField, MonthField, Textarea } from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";

import { REPORT_NOTE, currentMonthOf } from "../model";

import { type ReportForm } from "./form-options";

interface PropTypes {
  form: ReportForm;
  isDisabled: boolean;
  onPickBapel: (value: string) => void;
  onPickMonth: (value: string) => void;
}

export const ReportSection = (props: PropTypes) => {
  const { form, isDisabled, onPickBapel, onPickMonth } = props;

  return (
    <FormSection legend="Laporan" note={REPORT_NOTE} disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="bapelId"
        label="Badan pelayanan"
      >
        {(field) => (
          <BapelField
            id={field.name}
            value={field.value}
            onValueChange={onPickBapel}
            disabled={isDisabled}
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="month" label="Bulan laporan">
        {(field) => (
          <MonthField
            id={field.name}
            value={field.value}
            onValueChange={onPickMonth}
            max={currentMonthOf()}
            disabled={isDisabled}
          />
        )}
      </ControlField>

      <FormWide>
        <ControlField
          control={form.control}
          name="note"
          label="Keterangan"
          isOptional
        >
          {(field) => (
            <Textarea
              id={field.name}
              ref={field.ref}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              disabled={isDisabled}
              maxLength={250}
            />
          )}
        </ControlField>
      </FormWide>
    </FormSection>
  );
};
