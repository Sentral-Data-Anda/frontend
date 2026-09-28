"use client";

import { useWatch } from "react-hook-form";

import { ChoiceField, DdlField, Input } from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";

import type { EventFormValues } from "../model";

import { PLACE_OPTIONS, type EventForm } from "./form-options";

interface PropTypes {
  form: EventForm;
  isDisabled: boolean;
}

export const PlaceSection = (props: PropTypes) => {
  const { form, isDisabled } = props;

  const isIndoor = useWatch({ control: form.control, name: "isIndoor" });
  const savedRoomId = form.formState.defaultValues?.roomId ?? "";
  const rooms = useDdlOptions("room", "id", savedRoomId);

  const onPickPlace = (value: string) => {
    form.clearErrors(["roomId", "location"]);
    form.setValue("isIndoor", value as EventFormValues["isIndoor"], {
      shouldDirty: true,
    });
  };

  return (
    <FormSection legend="Tempat" disabled={isDisabled}>
      <FormWide>
        <ChoiceField
          id="isIndoor"
          label="Lokasi event"
          value={isIndoor}
          onValueChange={onPickPlace}
          options={PLACE_OPTIONS}
          disabled={isDisabled}
        />
      </FormWide>

      {isIndoor === "1" ? (
        <ControlField
          control={form.control}
          name="roomId"
          label="Ruang"
          hint="Hanya keterangan tempat. Pesan ruangnya lewat Peminjaman Ruang."
        >
          {(field) => (
            <DdlField
              value={field.value}
              onValueChange={field.onChange}
              options={rooms.options}
              isLoading={rooms.isLoading}
              disabled={isDisabled}
              placeholder="Pilih ruang"
              emptyMessage="Belum ada data ruang"
            />
          )}
        </ControlField>
      ) : (
        <ControlField
          control={form.control}
          name="location"
          label="Lokasi"
          hint="Nama tempat dan kotanya."
        >
          {(field) => <Input {...field} maxLength={100} />}
        </ControlField>
      )}
    </FormSection>
  );
};
