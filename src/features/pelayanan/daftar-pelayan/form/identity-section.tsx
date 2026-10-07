"use client";

import { useWatch } from "react-hook-form";

import {
  ChoiceField,
  DdlField,
  Input,
  SelectField,
} from "@/components/common/control";
import {
  ControlField,
  FormSection,
  FormWide,
  LockedField,
} from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { keepDigits } from "@/lib/number";

import { type PelayanFormValues } from "../model";
import { TYPE_PELAYAN_LABEL, type PelayanDetail } from "../types";

import { STATUS_OPTIONS, TYPE_OPTIONS, type PelayanForm } from "./form-options";
import { JemaatField } from "./jemaat-field";

const TYPE_BOUND = ["jemaatId", "name", "phone"] as const;

interface PropTypes {
  form: PelayanForm;
  isDisabled: boolean;
  saved?: PelayanDetail;
}

export const IdentitySection = (props: PropTypes) => {
  const { form, isDisabled, saved } = props;

  const [typePelayan, status] = useWatch({
    control: form.control,
    name: ["typePelayan", "status"],
  });
  const bapel = useDdlOptions("bapel", "id");
  const isGroup = typePelayan === "GROUP";
  const isDeactivating = saved?.status === true && status === "false";

  const onPickType = (value: string) => {
    const options = { shouldDirty: true };

    form.setValue(
      "typePelayan",
      value as PelayanFormValues["typePelayan"],
      options,
    );
    for (const name of TYPE_BOUND) form.setValue(name, "", options);
    form.setValue("members", [], options);
    form.setValue("rolePelayan", [], options);
    form.clearErrors([...TYPE_BOUND, "members", "rolePelayan"]);
  };

  return (
    <FormSection legend="Pelayan" disabled={isDisabled}>
      {saved ? (
        <LockedField
          id="typePelayan"
          label="Jenis"
          value={TYPE_PELAYAN_LABEL[saved.typePelayan]}
          hint="Jenis tidak bisa diubah. Hapus lalu daftarkan ulang bila keliru."
        />
      ) : (
        <FormWide>
          <ChoiceField
            id="typePelayan"
            label="Jenis"
            value={typePelayan}
            onValueChange={onPickType}
            options={TYPE_OPTIONS}
            disabled={isDisabled}
          />
        </FormWide>
      )}

      {isGroup ? (
        <>
          <ControlField
            control={form.control}
            name="name"
            label="Nama kelompok"
            hint="Mis. Paduan Suara Efrata, Band Pemuda."
          >
            {(field) => (
              <Input {...field} maxLength={50} autoCapitalize="words" />
            )}
          </ControlField>

          <ControlField
            control={form.control}
            name="phone"
            label="No. HP kontak"
            hint="Nomor yang dihubungi untuk jadwal kelompok ini."
          >
            {(field) => (
              <Input
                {...field}
                onChange={(event) =>
                  field.onChange(keepDigits(event.target.value, 12))
                }
                inputMode="numeric"
                autoComplete="tel"
                placeholder="08…"
              />
            )}
          </ControlField>
        </>
      ) : saved?.jemaat ? (
        <LockedField
          id="jemaatId"
          label="Jemaat"
          value={`${saved.jemaat.name} · ${saved.jemaat.code}`}
          hint="Jemaat tidak bisa diganti. Hapus lalu daftarkan jemaat lain."
        />
      ) : (
        <JemaatField form={form} isDisabled={isDisabled} />
      )}

      <ControlField
        control={form.control}
        name="bapelId"
        label="Badan pelayanan"
        hint={
          isGroup
            ? undefined
            : "Satu jemaat boleh terdaftar di beberapa badan pelayanan; daftarkan sekali per badan."
        }
      >
        {(field) => (
          <DdlField
            value={field.value}
            onValueChange={field.onChange}
            options={bapel.options}
            isLoading={bapel.isLoading}
            disabled={isDisabled}
            placeholder="Pilih badan pelayanan"
            emptyMessage="Belum ada data badan pelayanan"
          />
        )}
      </ControlField>

      <ControlField
        control={form.control}
        name="status"
        label="Status"
        isHintWarning={isDeactivating}
        hint={
          isDeactivating
            ? "Bila masih terjadwal, jadwalnya tetap memuat pelayan ini. Daftar jadwalnya muncul sesudah simpan."
            : "Pelayan nonaktif tidak muncul di pilihan Jadwal Pelayan; jadwal yang sudah dibuat tetap."
        }
      >
        {(field) => (
          <SelectField
            value={field.value}
            onValueChange={field.onChange}
            options={STATUS_OPTIONS}
            disabled={isDisabled}
            placeholder="Pilih status"
          />
        )}
      </ControlField>
    </FormSection>
  );
};
