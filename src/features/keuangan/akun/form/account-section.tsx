"use client";

import { Controller, useWatch } from "react-hook-form";

import {
  AccountField,
  ChoiceField,
  Input,
  SelectField,
} from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import type { AccountType } from "@/types/keuangan";

import {
  ACCOUNT_TYPE_LOCKED_HINT,
  CASH_FLOW_HINT,
  NET_ASSET_HINT,
  PARENT_NOTE,
  toAccountCode,
} from "../model";
import {
  ACCOUNT_STATUS_OPTIONS,
  ACCOUNT_TYPE_OPTIONS,
  CASH_FLOW_CATEGORY_OPTIONS,
  NET_ASSET_CLASS_OPTIONS,
} from "../types";

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

      {/* Keduanya hanya dipakai laporan, dan keduanya punya jawaban bawaan
          yang benar — jadi mereka ada di bagian sendiri, di bawah, bukan di
          tengah field yang wajib diisi. */}
      <FormWide>
        <ControlField
          control={form.control}
          name="netAssetClass"
          label="Kelas aset neto"
          isOptional
          hint={NET_ASSET_HINT}
        >
          {(field) => (
            // `placeholder` disamakan dengan label pilihan kosongnya, karena
            // "" di sini adalah JAWABAN, bukan field yang belum diisi: ia
            // dikirim sebagai null dan null dibaca tanpa pembatasan. Bawaan
            // "Pilih" membuat akun yang sudah benar terbaca seperti tertinggal.
            <SelectField
              value={field.value}
              onValueChange={field.onChange}
              options={NET_ASSET_CLASS_OPTIONS}
              placeholder="Tanpa pembatasan (bawaan)"
              disabled={isDisabled}
            />
          )}
        </ControlField>
      </FormWide>

      <FormWide>
        <ControlField
          control={form.control}
          name="cashFlowCategory"
          label="Kategori arus kas"
          isOptional
          hint={CASH_FLOW_HINT}
        >
          {(field) => (
            <SelectField
              value={field.value}
              onValueChange={field.onChange}
              options={CASH_FLOW_CATEGORY_OPTIONS}
              placeholder="Ikuti tipe akun"
              disabled={isDisabled}
            />
          )}
        </ControlField>
      </FormWide>
    </FormSection>
  );
};
