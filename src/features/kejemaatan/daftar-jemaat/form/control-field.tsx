"use client";

import type { ReactElement } from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type RefCallBack,
} from "react-hook-form";

import { FormField, type FieldControlProps } from "@/components/common/form";

import type { JemaatFormValues } from "../model";

type FieldName = FieldPath<JemaatFormValues>;

export type StringField = {
  name: string;
  value: string;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  ref: RefCallBack;
  disabled?: boolean;
};

export function ControlField({
  control,
  name,
  label,
  hint,
  isHintWarning = false,
  isOptional = false,
  children,
}: {
  control: Control<JemaatFormValues>;
  name: FieldName;
  label: string;
  hint?: string;
  isHintWarning?: boolean;
  isOptional?: boolean;
  children: (field: StringField) => ReactElement<FieldControlProps>;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormField
          htmlFor={name}
          error={fieldState.error?.message}
          hint={hint}
          isHintWarning={isHintWarning}
          label={
            <>
              {label}
              {isOptional ? (
                <span className="text-muted-foreground font-normal">
                  {" "}
                  (opsional)
                </span>
              ) : null}
            </>
          }
        >
          {children({ ...field, value: String(field.value ?? "") })}
        </FormField>
      )}
    />
  );
}
