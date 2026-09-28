"use client";

import { Controller } from "react-hook-form";

import { ChoiceField, DateField } from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { endOfYearIso } from "@/lib/date";

import {
  PIN_OPTIONS,
  PUBLISH_OPTIONS,
  type AnnouncementForm,
} from "./form-options";
import { StatusPreview } from "./status-preview";

const DATE_MAX = endOfYearIso(2);

interface PropTypes {
  form: AnnouncementForm;
  isDisabled: boolean;
}

export const ScheduleSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const publishDate = form.watch("publishDate");

  return (
    <FormSection legend="Penayangan" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="publishDate"
        label="Tanggal terbit"
      >
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            variant="dekat"
            max={DATE_MAX}
            label="Tanggal terbit"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="expiryDate"
        label="Tanggal berakhir"
        isOptional
      >
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            variant="dekat"
            min={publishDate || undefined}
            max={DATE_MAX}
            label="Tanggal berakhir"
            hint="Hari terakhir tampil. Kosongkan bila tidak berakhir."
            isClearable
          />
        )}
      </ControlField>

      <FormWide>
        <Controller
          control={form.control}
          name="isPublished"
          render={({ field }) => (
            <ChoiceField
              id="isPublished"
              label="Publikasi"
              value={field.value}
              onValueChange={field.onChange}
              options={PUBLISH_OPTIONS}
              disabled={isDisabled}
            />
          )}
        />
      </FormWide>

      <FormWide>
        <Controller
          control={form.control}
          name="isPinned"
          render={({ field }) => (
            <ChoiceField
              id="isPinned"
              label="Sematkan"
              value={field.value}
              onValueChange={field.onChange}
              options={PIN_OPTIONS}
              disabled={isDisabled}
            />
          )}
        />
      </FormWide>

      <FormWide>
        <StatusPreview form={form} />
      </FormWide>
    </FormSection>
  );
};
