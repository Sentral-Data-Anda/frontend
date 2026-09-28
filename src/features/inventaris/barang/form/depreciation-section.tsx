"use client";

import { useWatch } from "react-hook-form";

import {
  ChoiceField,
  DateField,
  Input,
  SelectField,
} from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { toDigits } from "@/lib/number";

import type { AssetFormValues } from "../model";

import {
  DEPRECIABLE_OPTIONS,
  LOCK_HINT,
  asOfOptions,
  type BarangForm,
} from "./form-options";

const DEPRECIATION_FIELDS = [
  "acquisitionCost",
  "usefulLifeMonths",
  "salvageValue",
  "depreciationStartDate",
  "openingAccumulatedDepreciation",
  "openingAccumulatedAsOf",
] as const;

interface PropTypes {
  form: BarangForm;
  isDisabled: boolean;
  isLocked: boolean;
}

export const DepreciationSection = (props: PropTypes) => {
  const { form, isDisabled, isLocked } = props;

  const isDepreciable = useWatch({
    control: form.control,
    name: "isDepreciable",
  });
  const savedAsOf = form.formState.defaultValues?.openingAccumulatedAsOf ?? "";
  const lockHint = isLocked ? LOCK_HINT : undefined;

  const onPickDepreciable = (value: string) => {
    form.clearErrors([...DEPRECIATION_FIELDS]);
    form.setValue("isDepreciable", value as AssetFormValues["isDepreciable"], {
      shouldDirty: true,
    });
  };

  return (
    <>
      <FormSection legend="Penyusutan" disabled={isDisabled}>
        <FormWide>
          <ChoiceField
            id="isDepreciable"
            label="Disusutkan"
            value={isDepreciable}
            onValueChange={onPickDepreciable}
            options={DEPRECIABLE_OPTIONS}
            disabled={isDisabled || isLocked}
          />
          {isLocked ? (
            <p className="text-muted-foreground mt-1.5 text-caption">
              {LOCK_HINT}
            </p>
          ) : null}
        </FormWide>

        {isDepreciable === "1" ? (
          <>
            <ControlField
              control={form.control}
              name="usefulLifeMonths"
              label="Masa manfaat (bulan)"
              hint="mis. 60 untuk 5 tahun"
            >
              {(field) => (
                <Input
                  {...field}
                  onChange={(event) =>
                    field.onChange(toDigits(event.target.value, 3))
                  }
                  inputMode="numeric"
                  autoComplete="off"
                  className="tabular-nums"
                />
              )}
            </ControlField>

            <ControlField
              control={form.control}
              name="salvageValue"
              label="Nilai residu (Rp)"
              hint="Perkiraan nilai di akhir masa manfaat"
              isOptional
            >
              {(field) => (
                <Input
                  {...field}
                  onChange={(event) =>
                    field.onChange(toDigits(event.target.value, 12))
                  }
                  inputMode="numeric"
                  autoComplete="off"
                  className="tabular-nums"
                />
              )}
            </ControlField>

            <ControlField
              control={form.control}
              name="depreciationStartDate"
              label="Mulai disusutkan"
              hint={lockHint ?? "Bulan ini ikut dihitung penuh"}
            >
              {(field) => (
                <DateField
                  value={field.value}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={isDisabled || isLocked}
                  variant="dekat"
                  label="Mulai disusutkan"
                />
              )}
            </ControlField>
          </>
        ) : null}
      </FormSection>

      {isDepreciable === "1" ? (
        <FormSection
          legend="Barang lama"
          note="Isi hanya untuk barang yang sudah disusutkan sebelum memakai aplikasi."
          disabled={isDisabled}
        >
          <ControlField
            control={form.control}
            name="openingAccumulatedDepreciation"
            label="Akumulasi penyusutan awal (Rp)"
            hint={lockHint}
          >
            {(field) => (
              <Input
                {...field}
                onChange={(event) =>
                  field.onChange(toDigits(event.target.value, 12))
                }
                inputMode="numeric"
                autoComplete="off"
                disabled={isLocked}
                readOnly={isLocked}
                className="tabular-nums"
              />
            )}
          </ControlField>

          <ControlField
            control={form.control}
            name="openingAccumulatedAsOf"
            label="Per bulan"
            hint={lockHint ?? "Bulan terakhir yang sudah disusutkan."}
          >
            {(field) => (
              <SelectField
                value={field.value}
                onValueChange={field.onChange}
                options={asOfOptions(savedAsOf)}
                disabled={isDisabled || isLocked}
                placeholder="Pilih bulan"
              />
            )}
          </ControlField>
        </FormSection>
      ) : null}
    </>
  );
};
