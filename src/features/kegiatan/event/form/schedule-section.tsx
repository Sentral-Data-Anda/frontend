"use client";

import { useWatch } from "react-hook-form";

import { DateField, Input } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";
import { endOfYearIso } from "@/lib/date";

import { type EventForm } from "./form-options";

interface PropTypes {
  form: EventForm;
  isDisabled: boolean;
}

export const ScheduleSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const startDate = useWatch({ control: form.control, name: "startDate" });
  const dateMax = endOfYearIso(2);

  const onPickStart = (value: string) => {
    const endDate = form.getValues("endDate");

    form.setValue("startDate", value, { shouldDirty: true });
    if (!endDate || endDate === startDate) {
      form.setValue("endDate", value, { shouldDirty: true });
    }
    if (form.formState.submitCount > 0)
      void form.trigger(["startDate", "endDate"]);
  };

  return (
    <FormSection legend="Waktu" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="startDate"
        label="Tanggal mulai"
      >
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={onPickStart}
            onBlur={field.onBlur}
            disabled={isDisabled}
            variant="dekat"
            max={dateMax}
            label="Tanggal mulai"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="endDate"
        label="Tanggal selesai"
      >
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            variant="dekat"
            min={startDate || undefined}
            max={dateMax}
            label="Tanggal selesai"
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="startTime" label="Jam mulai">
        {(field) => <Input {...field} type="time" />}
      </ControlField>

      <ControlField
        control={form.control}
        name="endTime"
        label="Jam selesai"
        isOptional
      >
        {(field) => <Input {...field} type="time" />}
      </ControlField>
    </FormSection>
  );
};
