"use client";

import { useEffect } from "react";
import { useWatch } from "react-hook-form";

import {
  AmountInput,
  ChoiceField,
  ComboboxField,
  DateField,
} from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { formatAmount } from "@/lib/format";

import {
  MAX_VALUE_DIGITS,
  PENETAPAN_PAIR_NOTE,
  pickedComponent,
} from "../model";
import {
  CALCULATION_TYPE_LABEL,
  COMPONENT_TYPE_LABEL,
  type KomponenPayrollOption,
  type PenetapanKomponen,
} from "../types";
import { LockedField } from "../ui";

import { VALUE_MODE_OPTIONS, type PenetapanForm } from "./penetapan-options";

const hintOf = (row: KomponenPayrollOption) =>
  [
    COMPONENT_TYPE_LABEL[row.type],
    CALCULATION_TYPE_LABEL[row.calculationType],
    row.defaultValue === null
      ? "tanpa default"
      : row.calculationType === "PERCENTAGE"
        ? `${Number(row.defaultValue)}%`
        : formatAmount(row.defaultValue),
  ].join(" · ");

interface PropTypes {
  form: PenetapanForm;
  isDisabled: boolean;
  assignment?: PenetapanKomponen;
}

export const PenetapanSection = (props: PropTypes) => {
  const { form, isDisabled, assignment } = props;

  const karyawanId = useWatch({ control: form.control, name: "karyawanId" });
  const componentId = useWatch({
    control: form.control,
    name: "payrollComponentId",
  });
  const valueMode = useWatch({ control: form.control, name: "valueMode" });
  const effectiveFrom = useWatch({
    control: form.control,
    name: "effectiveFrom",
  });

  const karyawan = useDdlOptions("karyawan", "id", karyawanId);
  const components = useDdlOptions<KomponenPayrollOption>(
    "komponen-payroll",
    "id",
    componentId,
    hintOf,
  );

  const picked = pickedComponent(components.rows, componentId);
  const isValueRequired = picked !== null && picked.defaultValue === null;
  const isOwnValue = valueMode === "nilai";
  const isEdit = assignment !== undefined;

  useEffect(() => {
    if (isValueRequired && valueMode === "kosong") {
      form.setValue("valueMode", "nilai");
    }
  }, [isValueRequired, valueMode, form]);

  return (
    <FormSection
      legend="Penetapan"
      note={isEdit ? PENETAPAN_PAIR_NOTE : undefined}
      disabled={isDisabled}
    >
      {isEdit ? (
        <LockedField
          id="karyawanId"
          label="Karyawan"
          value={assignment.karyawan.name}
        />
      ) : (
        <ControlField
          control={form.control}
          name="karyawanId"
          label="Karyawan"
        >
          {(field) => (
            <ComboboxField
              id={field.name}
              value={field.value}
              onValueChange={field.onChange}
              options={karyawan.options}
              isLoading={karyawan.isLoading}
              disabled={isDisabled}
              placeholder="Pilih karyawan"
              emptyMessage="Belum ada karyawan aktif"
            />
          )}
        </ControlField>
      )}

      {isEdit ? (
        <LockedField
          id="payrollComponentId"
          label="Komponen"
          value={assignment.payrollComponent.name}
        />
      ) : (
        <ControlField
          control={form.control}
          name="payrollComponentId"
          label="Komponen"
        >
          {(field) => (
            <ComboboxField
              id={field.name}
              value={field.value}
              onValueChange={field.onChange}
              options={components.options}
              isLoading={components.isLoading}
              disabled={isDisabled}
              placeholder="Pilih komponen"
              emptyMessage="Belum ada komponen aktif"
            />
          )}
        </ControlField>
      )}

      <FormWide>
        <ControlField
          control={form.control}
          name="valueMode"
          label="Nilai"
          hint={
            isValueRequired
              ? "Komponen ini tidak punya nilai default, jadi nilainya wajib diisi."
              : "Default komponen dipakai kalau Anda tidak mengisi angka sendiri."
          }
        >
          {(field) => (
            <ChoiceField
              id={field.name}
              label="Nilai"
              isLabelVisible={false}
              value={field.value}
              onValueChange={field.onChange}
              options={VALUE_MODE_OPTIONS}
              disabled={isDisabled || isValueRequired}
            />
          )}
        </ControlField>
      </FormWide>

      {isOwnValue ? (
        <ControlField
          control={form.control}
          name="value"
          label={
            picked?.calculationType === "PERCENTAGE"
              ? "Persentase (%)"
              : "Nilai (Rp)"
          }
        >
          {(field) => (
            <AmountInput
              id={field.name}
              ref={field.ref}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              disabled={isDisabled}
              maxDigits={
                picked?.calculationType === "PERCENTAGE"
                  ? 3
                  : MAX_VALUE_DIGITS
              }
              maxFraction={2}
            />
          )}
        </ControlField>
      ) : null}

      <ControlField
        control={form.control}
        name="effectiveFrom"
        label="Berlaku dari"
      >
        {(field) => (
          <DateField
            id={field.name}
            label="Berlaku dari"
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            isClearable={false}
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="effectiveTo"
        label="Berlaku sampai"
        isOptional
      >
        {(field) => (
          <DateField
            id={field.name}
            label="Berlaku sampai"
            hint="Kosongkan bila berlaku terus, atau ketik dd/mm/yyyy."
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            min={effectiveFrom || undefined}
          />
        )}
      </ControlField>
    </FormSection>
  );
};
