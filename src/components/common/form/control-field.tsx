"use client";

import type { ReactElement } from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
  type RefCallBack,
} from "react-hook-form";

import { FormField, type FieldControlProps } from "./form-field";

export type StringField = {
  name: string;
  value: string;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  ref: RefCallBack;
  disabled?: boolean;
};

interface PropTypes<TValues extends FieldValues> {
  control: Control<TValues>;
  name: FieldPath<TValues>;
  label: string;
  hint?: string;
  isHintWarning?: boolean;
  isOptional?: boolean;
  children: (field: StringField) => ReactElement<FieldControlProps>;
}

export function ControlField<TValues extends FieldValues>(
  props: PropTypes<TValues>,
) {
  const {
    control,
    name,
    label,
    hint,
    isHintWarning = false,
    isOptional = false,
    children,
  } = props;

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
