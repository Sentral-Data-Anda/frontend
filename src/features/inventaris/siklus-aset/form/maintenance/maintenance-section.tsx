"use client";

import { useWatch } from "react-hook-form";

import { DateField, SelectField, Textarea } from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { endOfYearIso, todayJakarta } from "@/lib/date";

import { AssetLink } from "../../asset-link";
import { AssetPicker } from "../../asset-picker";
import type { MaintenanceFormValues } from "../../model";
import { ReadField } from "../../read-field";
import type { AssetOption, Maintenance } from "../../types";

import { STATUS_OPTIONS, type MaintenanceForm } from "./form-options";

interface PropTypes {
  form: MaintenanceForm;
  isDisabled: boolean;
  saved?: Maintenance;
}

export const MaintenanceSection = (props: PropTypes) => {
  const { form, isDisabled, saved } = props;

  const [status, scheduledDate] = useWatch({
    control: form.control,
    name: ["status", "scheduledDate"],
  });
  const today = todayJakarta();
  const planMax = endOfYearIso(1);

  const onPickAsset = (value: string) =>
    form.setValue("assetId", value, { shouldDirty: true });

  const onPreset = (row: AssetOption) =>
    form.reset({ ...form.getValues(), assetId: String(row.id) });

  const onPickStatus = (value: string) => {
    form.setValue("status", value as MaintenanceFormValues["status"], {
      shouldDirty: true,
    });
    if (value !== "DONE") form.clearErrors("completedDate");
  };

  return (
    <FormSection legend="Perawatan" disabled={isDisabled}>
      {saved ? (
        <ReadField
          label="Barang"
          hint="Perawatan tidak bisa dipindah ke barang lain."
        >
          <span className="min-w-0 truncate">
            <AssetLink asset={saved.asset} />
          </span>
        </ReadField>
      ) : (
        <ControlField control={form.control} name="assetId" label="Barang">
          {(field) => (
            <AssetPicker
              value={field.value}
              onValueChange={onPickAsset}
              onPreset={onPreset}
              disabled={isDisabled}
            />
          )}
        </ControlField>
      )}

      <ControlField control={form.control} name="status" label="Status">
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={onPickStatus}
            options={STATUS_OPTIONS}
            disabled={isDisabled}
            placeholder="Pilih status"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="scheduledDate"
        label="Tanggal rencana"
      >
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            variant="dekat"
            label="Tanggal rencana"
            max={planMax}
          />
        )}
      </ControlField>

      {status === "DONE" ? (
        <ControlField
          control={form.control}
          name="completedDate"
          label="Tanggal selesai"
        >
          {(field) => (
            <DateField
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              disabled={isDisabled}
              variant="dekat"
              label="Tanggal selesai"
              min={scheduledDate || undefined}
              max={today}
            />
          )}
        </ControlField>
      ) : null}

      <FormWide>
        <ControlField
          control={form.control}
          name="description"
          label="Keterangan"
        >
          {(field) => (
            <Textarea
              {...field}
              maxLength={250}
              placeholder="mis. Ganti lampu proyektor"
            />
          )}
        </ControlField>
      </FormWide>
    </FormSection>
  );
};
