"use client";

import { DdlField } from "@/components/common/control";
import { ControlField } from "@/components/common/form";

import {
  pelayanOptionsOf,
  type JadwalForm,
  type SlotOptions,
} from "./form-options";

interface PropTypes {
  form: JadwalForm;
  index: number;
  roleId: string;
  takenKeys: ReadonlyMap<string, number>;
  slotOptions: SlotOptions;
  isDisabled: boolean;
}

export const PelayanField = (props: PropTypes) => {
  const { form, index, roleId, takenKeys, slotOptions, isDisabled } = props;

  const rows = slotOptions.byRole.get(roleId);
  const isBlocked = !slotOptions.isReady || !roleId;
  const placeholder = !slotOptions.isReady
    ? "Isi badan pelayanan, tanggal, dan jam dulu"
    : roleId
      ? "Pilih pelayan"
      : "Pilih tugas dulu";
  const hint = rows?.isError
    ? "Daftar pelayan gagal dimuat. Muat ulang halaman untuk mencoba lagi."
    : !isBlocked && rows?.rows?.length === 0
      ? "Belum ada pelayan aktif dengan tugas ini di badan pelayanan ini."
      : undefined;

  return (
    <ControlField
      control={form.control}
      name={`slots.${index}.pelayan`}
      label="Pelayan"
      hint={hint}
      isHintWarning={Boolean(hint)}
    >
      {(field) => (
        <DdlField
          value={field.value}
          onValueChange={field.onChange}
          options={pelayanOptionsOf(
            slotOptions,
            roleId,
            field.value,
            takenKeys,
          )}
          isLoading={rows?.isLoading ?? false}
          disabled={isDisabled || isBlocked}
          placeholder={placeholder}
          emptyMessage="Belum ada pelayan"
        />
      )}
    </ControlField>
  );
};
