"use client";

import type { ReactElement } from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type RefCallBack,
} from "react-hook-form";

import {
  FormField,
  type FieldControlProps,
} from "@/components/common/form-field";

import type { JemaatFormValues } from "../model";

type FieldName = FieldPath<JemaatFormValues>;

/**
 * Bentuk yang diterima kontrol. `value` dipersempit ke `string` karena SELURUH
 * nilai form jemaat memang string (lihat `model.ts`) — tanpa penyempitan ini
 * tiap kontrol harus menulis `as string` sendiri, dan cast yang tersebar
 * adalah cara tipe berhenti menjaga apa pun.
 */
export type StringField = {
  name: string;
  value: string;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  ref: RefCallBack;
  disabled?: boolean;
};

/**
 * `Controller` + `FormField` dalam satu baris.
 *
 * Form jemaat punya ±20 field. Menulis pasangan itu dua puluh kali berarti
 * dua puluh kesempatan lupa menyambungkan `error`, `htmlFor`, atau penanda
 * "(opsional)" — dan yang terlupa tidak pernah terlihat di layar, hanya di
 * pembaca layar.
 *
 * Penandanya adalah yang OPSIONAL, bukan yang wajib (form-pattern.md §3.5):
 * di form ini hampir semua field wajib, jadi bintang di mana-mana tidak
 * memberi informasi apa pun.
 */
export function ControlField({
  control,
  name,
  label,
  hint,
  isOptional = false,
  children,
}: {
  control: Control<JemaatFormValues>;
  name: FieldName;
  label: string;
  /** Hanya bila menjelaskan hal yang TIDAK terlihat dari kontrolnya. */
  hint?: string;
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
