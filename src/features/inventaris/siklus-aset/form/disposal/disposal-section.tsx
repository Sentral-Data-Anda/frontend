"use client";

import { useWatch } from "react-hook-form";

import {
  DateField,
  Input,
  SelectField,
  Textarea,
} from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { todayJakarta } from "@/lib/date";
import { toDigits } from "@/lib/number";

import { AssetPicker } from "../../asset-picker";
import type { DisposalFormValues } from "../../model";
import type { AssetOption } from "../../types";

import { METHOD_OPTIONS, type DisposalForm } from "./form-options";

interface PropTypes {
  form: DisposalForm;
  isDisabled: boolean;
  onPickAsset: (row: AssetOption | undefined) => void;
}

export const DisposalSection = (props: PropTypes) => {
  const { form, isDisabled, onPickAsset } = props;

  const method = useWatch({ control: form.control, name: "method" });

  const onPick = (value: string, row: AssetOption | undefined) => {
    form.setValue("assetId", value, { shouldDirty: true });
    form.clearErrors("assetId");
    onPickAsset(row);
  };

  const onPreset = (row: AssetOption) => {
    form.reset({ ...form.getValues(), assetId: String(row.id) });
    onPickAsset(row);
  };

  const onPickMethod = (value: string) => {
    form.setValue("method", value as DisposalFormValues["method"], {
      shouldDirty: true,
    });
    form.clearErrors("method");
    if (value !== "SOLD") {
      form.setValue("proceeds", "");
      form.clearErrors("proceeds");
    }
  };

  return (
    <FormSection
      legend="Pelepasan"
      note="Pelepasan berlaku sesudah disetujui di Permintaan Persetujuan. Pencatatan keuangan pelepasan dilakukan bendahara di Jurnal."
      disabled={isDisabled}
    >
      <ControlField control={form.control} name="assetId" label="Barang">
        {(field) => (
          <AssetPicker
            value={field.value}
            onValueChange={onPick}
            onPreset={onPreset}
            disabled={isDisabled}
            isCostShown
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="method" label="Cara">
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={onPickMethod}
            options={METHOD_OPTIONS}
            disabled={isDisabled}
            placeholder="Pilih cara"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="disposalDate"
        label="Tanggal pelepasan"
      >
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            variant="dekat"
            label="Tanggal pelepasan"
            max={todayJakarta()}
          />
        )}
      </ControlField>

      {method === "SOLD" ? (
        <ControlField
          control={form.control}
          name="proceeds"
          label="Hasil penjualan (Rp)"
        >
          {(field) => (
            <Input
              {...field}
              onChange={(event) =>
                field.onChange(toDigits(event.target.value, 12))
              }
              inputMode="numeric"
              autoComplete="off"
              placeholder="0"
              className="tabular-nums"
            />
          )}
        </ControlField>
      ) : null}

      <FormWide>
        <ControlField control={form.control} name="reason" label="Alasan">
          {(field) => (
            <Textarea
              {...field}
              maxLength={250}
              placeholder="mis. Rusak berat, biaya perbaikan melebihi harga baru"
            />
          )}
        </ControlField>
      </FormWide>
    </FormSection>
  );
};
