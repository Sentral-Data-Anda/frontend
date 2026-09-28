"use client";

import {
  DateField,
  SelectField,
  Textarea,
  type SelectOption,
} from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { todayJakarta } from "@/lib/date";

import type { OpnameForm } from "./form-options";

interface PropTypes {
  form: OpnameForm;
  roomOptions: readonly SelectOption[];
  isDisabled: boolean;
}

export const HeaderSection = (props: PropTypes) => {
  const { form, roomOptions, isDisabled } = props;

  return (
    <FormSection legend="Stok opname" disabled={isDisabled}>
      <ControlField control={form.control} name="opnameDate" label="Tanggal">
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            variant="dekat"
            max={todayJakarta()}
            label="Tanggal opname"
            isClearable={false}
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="roomId" label="Ruang">
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={roomOptions}
            disabled={isDisabled}
            placeholder="Pilih ruang"
          />
        )}
      </ControlField>

      <FormWide>
        <ControlField
          control={form.control}
          name="note"
          label="Catatan"
          isOptional
        >
          {(field) => (
            <Textarea
              {...field}
              maxLength={250}
              rows={2}
              placeholder="mis. Hitung akhir bulan sebelum Perjamuan Kudus"
            />
          )}
        </ControlField>
      </FormWide>
    </FormSection>
  );
};
