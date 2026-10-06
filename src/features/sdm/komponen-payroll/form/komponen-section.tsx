"use client";

import { useEffect } from "react";
import { useWatch } from "react-hook-form";

import {
  AmountInput,
  ChoiceField,
  Input,
  SelectField,
} from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";

import {
  INACTIVE_NOTE,
  MAX_VALUE_DIGITS,
  calculationHint,
} from "../model";
import { LockedField } from "../ui";

import {
  CALCULATION_OPTIONS,
  DEFAULT_VALUE_OPTIONS,
  STATUS_OPTIONS,
  TAXABLE_OPTIONS,
  TYPE_OPTIONS,
  type KomponenForm,
} from "./katalog-options";

interface PropTypes {
  form: KomponenForm;
  isDisabled: boolean;
  code?: string;
}

export const KomponenSection = (props: PropTypes) => {
  const { form, isDisabled, code } = props;

  const valueMode = useWatch({ control: form.control, name: "valueMode" });
  const calculationType = useWatch({
    control: form.control,
    name: "calculationType",
  });
  const isPerPerson = valueMode === "kosong";

  useEffect(() => {
    if (isPerPerson) form.setValue("defaultValue", "");
  }, [isPerPerson, form]);

  return (
    <FormSection legend="Komponen" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="name"
        label="Nama"
        hint="Mis. Tunjangan Transport."
      >
        {(field) => <Input {...field} maxLength={100} autoCapitalize="words" />}
      </ControlField>

      {code ? <LockedField id="code" label="Kode" value={code} /> : null}

      <FormWide>
        <ControlField
          control={form.control}
          name="type"
          label="Jenis"
          hint="Tunjangan menambah gaji; potongan menguranginya."
        >
          {(field) => (
            <ChoiceField
              id={field.name}
              label="Jenis"
              isLabelVisible={false}
              value={field.value}
              onValueChange={field.onChange}
              options={TYPE_OPTIONS}
              disabled={isDisabled}
            />
          )}
        </ControlField>
      </FormWide>

      <FormWide>
        <ControlField
          control={form.control}
          name="calculationType"
          label="Cara hitung"
          hint={calculationHint(calculationType)}
        >
          {(field) => (
            <ChoiceField
              id={field.name}
              label="Cara hitung"
              isLabelVisible={false}
              value={field.value}
              onValueChange={field.onChange}
              options={CALCULATION_OPTIONS}
              disabled={isDisabled}
            />
          )}
        </ControlField>
      </FormWide>

      <FormWide>
        <ControlField
          control={form.control}
          name="valueMode"
          label="Nilai default"
          hint="Pilih Berbeda per orang bila nominalnya ditentukan di penetapan tiap karyawan."
        >
          {(field) => (
            <ChoiceField
              id={field.name}
              label="Nilai default"
              isLabelVisible={false}
              value={field.value}
              onValueChange={field.onChange}
              options={DEFAULT_VALUE_OPTIONS}
              disabled={isDisabled}
            />
          )}
        </ControlField>
      </FormWide>

      {isPerPerson ? null : (
        <ControlField
          control={form.control}
          name="defaultValue"
          label={calculationType === "PERCENTAGE" ? "Persentase (%)" : "Nilai (Rp)"}
        >
          {(field) => (
            <AmountInput
              id={field.name}
              ref={field.ref}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              disabled={isDisabled}
              maxDigits={calculationType === "PERCENTAGE" ? 3 : MAX_VALUE_DIGITS}
              maxFraction={2}
            />
          )}
        </ControlField>
      )}

      <ControlField
        control={form.control}
        name="isTaxable"
        label="Pajak"
        hint="Dipakai perhitungan pajak. Gereja ini belum memotong PPh21."
      >
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={TAXABLE_OPTIONS}
            disabled={isDisabled}
            placeholder="Pilih status pajak"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="isActive"
        label="Status"
        hint={INACTIVE_NOTE}
      >
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={STATUS_OPTIONS}
            disabled={isDisabled}
            placeholder="Pilih status"
          />
        )}
      </ControlField>
    </FormSection>
  );
};
