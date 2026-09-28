"use client";

import { useWatch } from "react-hook-form";

import { ChoiceField, DateField, Input } from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { todayJakarta } from "@/lib/date";
import { toDigits } from "@/lib/number";

import { isDonated, type AssetFormValues } from "../model";

import { LOCK_HINT, SOURCE_OPTIONS, type BarangForm } from "./form-options";

interface PropTypes {
  form: BarangForm;
  isDisabled: boolean;
  isDepreciationLocked: boolean;
}

export const AcquisitionSection = (props: PropTypes) => {
  const { form, isDisabled, isDepreciationLocked } = props;

  const source = useWatch({ control: form.control, name: "acquisitionSource" });
  const isGift = isDonated(source);

  const onPickSource = (value: string) => {
    form.clearErrors("donorName");
    form.setValue(
      "acquisitionSource",
      value as AssetFormValues["acquisitionSource"],
      { shouldDirty: true },
    );
  };

  return (
    <FormSection
      legend="Perolehan"
      note="Isi bila diketahui."
      disabled={isDisabled}
    >
      <FormWide>
        <ChoiceField
          id="acquisitionSource"
          label="Sumber"
          value={source}
          onValueChange={onPickSource}
          options={SOURCE_OPTIONS}
          disabled={isDisabled}
        />
      </FormWide>

      {isGift ? (
        <ControlField
          control={form.control}
          name="donorName"
          label="Nama pemberi"
        >
          {(field) => (
            <Input
              {...field}
              maxLength={150}
              autoComplete="off"
              placeholder="mis. Keluarga Bpk. Simanjuntak"
            />
          )}
        </ControlField>
      ) : null}

      <ControlField
        control={form.control}
        name="acquisitionDate"
        label="Tanggal perolehan"
      >
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            variant="dekat"
            max={todayJakarta()}
            label="Tanggal perolehan"
            isClearable
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="acquisitionCost"
        label={
          isGift ? "Nilai perolehan (perkiraan, Rp)" : "Harga perolehan (Rp)"
        }
        hint={isDepreciationLocked ? LOCK_HINT : undefined}
      >
        {(field) => (
          <Input
            {...field}
            onChange={(event) =>
              field.onChange(toDigits(event.target.value, 12))
            }
            inputMode="numeric"
            autoComplete="off"
            placeholder="mis. 8500000"
            disabled={isDepreciationLocked}
            readOnly={isDepreciationLocked}
            className="tabular-nums"
          />
        )}
      </ControlField>
    </FormSection>
  );
};
