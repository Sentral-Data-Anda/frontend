"use client";

import { useEffect } from "react";
import { useWatch } from "react-hook-form";

import {
  AmountInput,
  ChoiceField,
  ComboboxField,
  DateField,
} from "@/components/common/control";
import {
  ControlField,
  FormSection,
  FormWide,
  LockedField,
} from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { formatAmount } from "@/lib/format";

import {
  INACTIVE_COMPONENT_NOTE,
  MAX_VALUE_DIGITS,
  PENETAPAN_PAIR_NOTE,
  assignableOptions,
  pickedComponent,
} from "../model";
import {
  CALCULATION_TYPE_LABEL,
  COMPONENT_TYPE_LABEL,
  type AssignedComponent,
  type KomponenPayrollOption,
  type PenetapanKomponen,
} from "../types";

import { VALUE_MODE_OPTIONS, type PenetapanForm } from "./penetapan-options";

const PERCENTAGE_DIGITS = 3;

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

type ChosenComponent = Pick<
  AssignedComponent,
  "calculationType" | "defaultValue"
>;

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

  const componentOptions = assignableOptions(
    components.rows,
    components.options,
  );

  // Pemilih hanya memuat komponen aktif, jadi penetapan atas komponen yang
  // sudah dimatikan mengambil bentuknya dari relasi penetapan.
  const chosen: ChosenComponent | null =
    pickedComponent(components.rows, componentId) ??
    assignment?.payrollComponent ??
    null;

  const chosenCalculation = chosen?.calculationType;
  const isPercentage = chosenCalculation === "PERCENTAGE";
  const isValueRequired = chosen !== null && chosen.defaultValue === null;
  const isOwnValue = valueMode === "nilai";
  const isEdit = assignment !== undefined;
  const isComponentRetired =
    assignment !== undefined && !assignment.payrollComponent.isActive;

  useEffect(() => {
    if (isValueRequired && valueMode === "kosong") {
      form.setValue("valueMode", "nilai");
    }
  }, [isValueRequired, valueMode, form]);

  useEffect(() => {
    if (!chosenCalculation) return;

    form.setValue("calculationType", chosenCalculation);
  }, [chosenCalculation, form]);

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
        <ControlField control={form.control} name="karyawanId" label="Karyawan">
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
          hint={isComponentRetired ? INACTIVE_COMPONENT_NOTE : undefined}
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
              options={componentOptions}
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
          label={isPercentage ? "Persentase (%)" : "Nilai (Rp)"}
          hint={
            isPercentage ? "Persen dari gaji pokok, maksimal 100." : undefined
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
              maxDigits={isPercentage ? PERCENTAGE_DIGITS : MAX_VALUE_DIGITS}
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
