"use client";

import { Controller } from "react-hook-form";

import {
  BapelField,
  ChoiceField,
  DateField,
  Input,
  SelectField,
  Textarea,
  type SelectOption,
} from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";

import {
  PROPOSAL_NOTE,
  SPAN_NOTE,
  UNPLANNED_NOTE,
  UNPLANNED_OPTIONS,
} from "../model";

import { type ProgramForm } from "./form-options";

interface PropTypes {
  form: ProgramForm;
  yearOptions: readonly SelectOption[];
  isDisabled: boolean;
}

export const ProposalSection = (props: PropTypes) => {
  const { form, yearOptions, isDisabled } = props;

  return (
    <FormSection legend="Usulan" note={PROPOSAL_NOTE} disabled={isDisabled}>
      <FormWide>
        <ControlField control={form.control} name="name" label="Nama program">
          {(field) => (
            <Input
              id={field.name}
              ref={field.ref}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              disabled={isDisabled}
              maxLength={150}
            />
          )}
        </ControlField>
      </FormWide>

      <ControlField
        control={form.control}
        name="bapelId"
        label="Badan pelayanan"
      >
        {(field) => (
          <BapelField
            id={field.name}
            value={field.value}
            onValueChange={field.onChange}
            disabled={isDisabled}
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="year"
        label="Tahun pelayanan"
        hint={SPAN_NOTE}
      >
        {(field) => (
          <SelectField
            id={field.name}
            value={field.value}
            onValueChange={field.onChange}
            options={yearOptions}
            disabled={isDisabled}
            placeholder="Pilih tahun pelayanan"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="startDate"
        label="Tanggal mulai"
        isOptional
      >
        {(field) => (
          <DateField
            id={field.name}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            variant="dekat"
            label="Tanggal mulai"
            isClearable
            disabled={isDisabled}
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="endDate"
        label="Tanggal selesai"
        isOptional
      >
        {(field) => (
          <DateField
            id={field.name}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            variant="dekat"
            label="Tanggal selesai"
            isClearable
            disabled={isDisabled}
          />
        )}
      </ControlField>

      <FormWide>
        <Controller
          control={form.control}
          name="isUnplanned"
          render={({ field }) => (
            <div>
              <ChoiceField
                id="isUnplanned"
                label="Program mendadak"
                value={String(field.value)}
                onValueChange={field.onChange}
                options={UNPLANNED_OPTIONS}
                disabled={isDisabled}
              />

              <p className="text-muted-foreground mt-1.5 text-caption">
                {UNPLANNED_NOTE}
              </p>
            </div>
          )}
        />
      </FormWide>

      <FormWide>
        <ControlField
          control={form.control}
          name="description"
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
