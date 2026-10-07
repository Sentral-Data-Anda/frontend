"use client";

import { Controller, useWatch } from "react-hook-form";

import { AccountField, ChoiceField, Input } from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import type { AccountType } from "@/types/keuangan";

import { ACCOUNT_TYPE_LOCKED_HINT, PARENT_NOTE, toAccountCode } from "../model";
import { ACCOUNT_STATUS_OPTIONS, ACCOUNT_TYPE_OPTIONS } from "../types";

import { type AccountForm } from "./form-options";

interface PropTypes {
  form: AccountForm;
  isDisabled: boolean;
  isEdit: boolean;
  isTypeLocked: boolean;
}

export const AccountSection = (props: PropTypes) => {
  const { form, isDisabled, isEdit, isTypeLocked } = props;

  const type = useWatch({ control: form.control, name: "type" });

  const onPickType = (value: string, onChange: (next: string) => void) => {
    onChange(value);
    form.setValue("parentAccountId", "", { shouldDirty: true });
  };

  return (
    <FormSection legend="Akun" note={PARENT_NOTE} disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="code"
        label="Kode"
        hint={
          isEdit
            ? "Kode tidak bisa diubah sesudah disimpan."
            : "Huruf, angka, titik, dan strip. Mis. 1-100."
        }
      >
        {(field) => (
          <Input
            {...field}
            onChange={(event) =>
              field.onChange(toAccountCode(event.target.value))
            }
            disabled={isEdit || isDisabled}
            maxLength={20}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            inputMode="text"
            placeholder="mis. 1-100"
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="name" label="Nama">
        {(field) => (
          <Input
            {...field}
            maxLength={100}
            autoCapitalize="words"
            placeholder="mis. Kas"
          />
        )}
      </ControlField>

      <FormWide>
        <Controller
          control={form.control}
          name="type"
          render={({ field, fieldState }) => (
            <div>
              <ChoiceField
                id="type"
                label="Tipe"
                value={field.value}
                onValueChange={(value) => onPickType(value, field.onChange)}
                options={ACCOUNT_TYPE_OPTIONS}
                disabled={isDisabled || isTypeLocked}
                error={fieldState.error?.message}
                hint={
                  isTypeLocked
                    ? ACCOUNT_TYPE_LOCKED_HINT
                    : "Tipe menentukan laporan tempat akun ini muncul."
                }
              />
            </div>
          )}
        />
      </FormWide>

      <ControlField
        control={form.control}
        name="parentAccountId"
        label="Akun induk"
        isOptional
        hint="Hanya akun bertipe sama yang bisa jadi induk."
      >
        {(field) => (
          <AccountField
            value={field.value}
            onValueChange={field.onChange}
            type={type as AccountType}
            disabled={isDisabled}
            placeholder="Tanpa induk"
          />
        )}
      </ControlField>

      <Controller
        control={form.control}
        name="isActive"
        render={({ field }) => (
          <div>
            <ChoiceField
              id="isActive"
              label="Status"
              value={field.value}
              onValueChange={field.onChange}
              options={ACCOUNT_STATUS_OPTIONS}
              disabled={isDisabled}
              hint="Akun nonaktif tidak bisa dipilih di catatan baru, dan catatan lamanya tetap utuh."
            />
          </div>
        )}
      />
    </FormSection>
  );
};
