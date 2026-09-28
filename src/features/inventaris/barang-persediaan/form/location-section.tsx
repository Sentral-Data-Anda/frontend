"use client";

import { DdlField } from "@/components/common/control";
import { ControlField, FormSection } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";

import { savedOf, type StockForm } from "./form-options";

interface PropTypes {
  form: StockForm;
  isDisabled: boolean;
  isEdit: boolean;
}

export const LocationSection = (props: PropTypes) => {
  const { form, isDisabled, isEdit } = props;

  const rooms = useDdlOptions("room", "id", savedOf(form, "roomId"));
  const bapel = useDdlOptions("bapel", "id", savedOf(form, "bapelId"));

  return (
    <FormSection legend="Lokasi" disabled={isDisabled}>
      <ControlField
        control={form.control}
        name="roomId"
        label="Ruang"
        hint={isEdit ? "Seluruh stok ikut pindah ke ruang ini." : undefined}
      >
        {(field) => (
          <DdlField
            value={field.value}
            onValueChange={field.onChange}
            options={rooms.options}
            isLoading={rooms.isLoading}
            disabled={isDisabled}
            placeholder="Pilih ruang"
            emptyMessage="Belum ada ruang aktif"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="bapelId"
        label="Badan pelayanan"
      >
        {(field) => (
          <DdlField
            value={field.value}
            onValueChange={field.onChange}
            options={bapel.options}
            isLoading={bapel.isLoading}
            disabled={isDisabled}
            placeholder="Pilih badan pelayanan"
            emptyMessage="Belum ada badan pelayanan"
          />
        )}
      </ControlField>
    </FormSection>
  );
};
