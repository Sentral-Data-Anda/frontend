"use client";

import { useWatch } from "react-hook-form";

import { DateField, DdlField, Textarea } from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { todayJakarta } from "@/lib/date";

import { AssetPicker } from "../../asset-picker";
import { locationOf, type TransferFormValues } from "../../model";
import { ReadField } from "../../read-field";
import type { AssetOption } from "../../types";

import type { TransferForm } from "./form-options";

const LOCATION_FIELDS = ["toRoomId", "toBapelId"] as const;

const locationValuesOf = (row: AssetOption | undefined) => {
  const roomId = row?.room ? String(row.room.id) : "";
  const bapelId = row?.bapel ? String(row.bapel.id) : "";

  return {
    fromRoomId: roomId,
    fromBapelId: bapelId,
    toRoomId: roomId,
    toBapelId: bapelId,
  } satisfies Partial<TransferFormValues>;
};

interface PropTypes {
  form: TransferForm;
  isDisabled: boolean;
  asset: AssetOption | undefined;
  onPickAsset: (row: AssetOption | undefined) => void;
}

export const TransferSection = (props: PropTypes) => {
  const { form, isDisabled, asset, onPickAsset } = props;

  const [toRoomId, toBapelId] = useWatch({
    control: form.control,
    name: [...LOCATION_FIELDS],
  });
  const rooms = useDdlOptions("room", "id", toRoomId);
  const bapels = useDdlOptions("bapel", "id", toBapelId);

  const onPick = (value: string, row: AssetOption | undefined) => {
    const options = { shouldDirty: true };

    form.setValue("assetId", value, options);
    for (const [name, next] of Object.entries(locationValuesOf(row))) {
      form.setValue(name as keyof TransferFormValues, next, options);
    }
    form.clearErrors(["assetId", ...LOCATION_FIELDS]);
    onPickAsset(row);
  };

  const onPreset = (row: AssetOption) => {
    form.reset({
      ...form.getValues(),
      assetId: String(row.id),
      ...locationValuesOf(row),
    });
    onPickAsset(row);
  };

  return (
    <FormSection legend="Pindah lokasi" disabled={isDisabled}>
      <ControlField control={form.control} name="assetId" label="Barang">
        {(field) => (
          <AssetPicker
            value={field.value}
            onValueChange={onPick}
            onPreset={onPreset}
            disabled={isDisabled}
          />
        )}
      </ControlField>

      <ReadField label="Lokasi sekarang">
        {asset ? (
          locationOf(asset)
        ) : (
          <span className="text-muted-foreground">Pilih barang dulu</span>
        )}
      </ReadField>

      <ControlField control={form.control} name="toRoomId" label="Ruang tujuan">
        {(field) => (
          <DdlField
            value={field.value}
            onValueChange={field.onChange}
            options={rooms.options}
            isLoading={rooms.isLoading}
            disabled={isDisabled}
            placeholder="Pilih ruang tujuan"
            emptyMessage="Belum ada ruang aktif"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="toBapelId"
        label="Badan pelayanan tujuan"
      >
        {(field) => (
          <DdlField
            value={field.value}
            onValueChange={field.onChange}
            options={bapels.options}
            isLoading={bapels.isLoading}
            disabled={isDisabled}
            placeholder="Pilih badan pelayanan tujuan"
            emptyMessage="Belum ada badan pelayanan"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="transferDate"
        label="Tanggal pindah"
      >
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isDisabled}
            variant="dekat"
            label="Tanggal pindah"
            max={todayJakarta()}
          />
        )}
      </ControlField>

      <FormWide>
        <ControlField
          control={form.control}
          name="reason"
          label="Alasan"
          isOptional
        >
          {(field) => (
            <Textarea
              {...field}
              maxLength={250}
              placeholder="mis. Dipakai tetap di ruang ibadah"
            />
          )}
        </ControlField>
      </FormWide>
    </FormSection>
  );
};
