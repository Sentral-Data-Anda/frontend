"use client";

import Link from "next/link";

import {
  Button,
  DateField,
  Input,
  SelectField,
  buttonVariants,
} from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";

import { type MarriageForm } from "./form-options";

const BLESSED_OPTIONS = [
  { value: "true", label: "Ya" },
  { value: "false", label: "Tidak" },
];

interface PropTypes {
  form: MarriageForm;
  isDisabled: boolean;
  endHref?: string;
  isDirty: boolean;
}

export const MarriageSection = (props: PropTypes) => {
  const { form, isDisabled, endHref, isDirty } = props;

  return (
    <FormSection legend="Pernikahan" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="marriedAt"
        label="Tanggal menikah"
        isOptional
      >
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={field.disabled}
            label="Tanggal menikah"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="marriedPlace"
        label="Tempat"
        isOptional
      >
        {(field) => <Input {...field} maxLength={100} />}
      </ControlField>

      <ControlField
        control={form.control}
        name="blessedHere"
        label="Diberkati di gereja ini"
      >
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={BLESSED_OPTIONS}
            disabled={isDisabled}
          />
        )}
      </ControlField>

      {endHref ? (
        <FormWide className="flex flex-wrap items-center gap-3">
          {isDirty ? (
            <>
              <Button type="button" variant="outline" disabled>
                Akhiri pernikahan
              </Button>
              <p className="text-muted-foreground text-caption">
                Simpan atau batalkan perubahan dulu sebelum mengakhiri
                pernikahan.
              </p>
            </>
          ) : (
            <Link
              href={endHref}
              className={buttonVariants({ variant: "outline" })}
            >
              Akhiri pernikahan
            </Link>
          )}
        </FormWide>
      ) : null}
    </FormSection>
  );
};
