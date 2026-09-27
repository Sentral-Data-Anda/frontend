"use client";

import { DdlField, Input, Textarea } from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";

import { withSavedOption } from "../model";
import type { Ibadah } from "../types";

import { type IbadahForm, withNoneOption } from "./form-options";

interface PropTypes {
  form: IbadahForm;
  isDisabled: boolean;
  saved?: Ibadah;
}

export const ConductSection = (props: PropTypes) => {
  const { form, isDisabled, saved } = props;

  const rooms = useDdlOptions("room", "id");
  const bapels = useDdlOptions("bapel", "id");

  const roomOptions = withNoneOption(
    "Tanpa ruang",
    withSavedOption(rooms.options, saved?.room),
  );
  const bapelOptions = withNoneOption(
    "Tanpa badan pelayanan",
    withSavedOption(bapels.options, saved?.bapel),
  );

  return (
    <FormSection
      legend="Pelaksanaan"
      note="Semua opsional; bisa dilengkapi nanti."
      disabled={isDisabled}
    >
      <ControlField control={form.control} name="theme" label="Tema">
        {(field) => <Input {...field} maxLength={150} />}
      </ControlField>

      <ControlField
        control={form.control}
        name="bibleVerse"
        label="Ayat Alkitab"
        hint="Mis. Yohanes 3:16–21."
      >
        {(field) => <Input {...field} maxLength={100} />}
      </ControlField>

      <ControlField
        control={form.control}
        name="preacher"
        label="Pengkhotbah"
        hint="Tulis nama seperti biasa dipanggil, mis. Pdt. Yohanes Simatupang."
      >
        {(field) => <Input {...field} maxLength={150} autoCapitalize="words" />}
      </ControlField>

      <ControlField control={form.control} name="roomId" label="Ruang">
        {(field) => (
          <DdlField
            value={field.value}
            onValueChange={field.onChange}
            options={roomOptions}
            isLoading={rooms.isLoading}
            disabled={isDisabled}
            placeholder="Pilih ruang"
            emptyMessage="Belum ada data ruang"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="bapelId"
        label="Badan pelayanan"
        hint="Isi bila diadakan komisi tertentu, mis. Ibadah Pemuda."
      >
        {(field) => (
          <DdlField
            value={field.value}
            onValueChange={field.onChange}
            options={bapelOptions}
            isLoading={bapels.isLoading}
            disabled={isDisabled}
            placeholder="Pilih badan pelayanan"
            emptyMessage="Belum ada data badan pelayanan"
          />
        )}
      </ControlField>

      <FormWide>
        <ControlField control={form.control} name="note" label="Catatan">
          {(field) => <Textarea {...field} maxLength={250} rows={3} />}
        </ControlField>
      </FormWide>
    </FormSection>
  );
};
