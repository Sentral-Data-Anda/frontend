"use client";

import { Lock } from "lucide-react";
import { Controller } from "react-hook-form";

import { ChoiceField, Input } from "@/components/common/control";
import {
  ControlField,
  FormField,
  FormSection,
  FormWide,
} from "@/components/common/form";

import { toDigits } from "../model";

import {
  PAID_OPTIONS,
  QUOTA_OPTIONS,
  STATUS_OPTIONS,
  type TipeCutiForm,
} from "./form-options";

// Wajib, bukan gaya: `isPaid` dekoratif (SDM README §2.7, U-F).
const SECTION_NOTE =
  '"Dibayar" hanya penanda untuk catatan. Penggajian tidak membaca cuti, jadi cuti tak dibayar tidak mengurangi gaji secara otomatis.';

const QUOTA_HINT = "Jatah yang dihitung per tahun kalender.";

const QUOTA_EDIT_HINT =
  "Menurunkan jatah tidak membatalkan cuti yang sudah disetujui. Karyawan yang sudah melewati jatah baru akan tercatat sisa 0 hari.";

const STATUS_HINT =
  "Tipe tidak aktif tidak bisa dipilih untuk pengajuan cuti baru; cuti yang sudah tercatat tetap memakainya.";

interface PropTypes {
  form: TipeCutiForm;
  isDisabled: boolean;
  code?: string;
}

export const TypeSection = (props: PropTypes) => {
  const { form, isDisabled, code } = props;

  const isUnlimited = form.watch("isUnlimited") === "true";

  const onPickQuotaMode = (value: string) => {
    const isPicked = value === "true";

    form.setValue("isUnlimited", isPicked ? "true" : "false", {
      shouldDirty: true,
    });

    if (!isPicked) return;

    form.setValue("maxDaysPerYear", "", { shouldDirty: true });
    form.clearErrors("maxDaysPerYear");
  };

  return (
    <FormSection legend="Tipe Cuti" note={SECTION_NOTE} disabled={isDisabled}>
      {/* Selebar grid supaya "Jatah per tahun" dan "Jumlah hari" yang ia
          matikan jatuh berdampingan di pita dua kolom, bukan diagonal. */}
      <FormWide>
        <ControlField
          control={form.control}
          name="name"
          label="Nama"
          hint="Mis. Cuti Tahunan, Cuti Melahirkan."
        >
          {(field) => (
            <Input
              {...field}
              maxLength={50}
              autoComplete="off"
              autoCapitalize="words"
            />
          )}
        </ControlField>
      </FormWide>

      <Controller
        control={form.control}
        name="isUnlimited"
        render={({ field }) => (
          <ChoiceField
            id="isUnlimited"
            label="Jatah per tahun"
            value={field.value}
            onValueChange={onPickQuotaMode}
            options={QUOTA_OPTIONS}
            disabled={isDisabled}
          />
        )}
      />

      <ControlField
        control={form.control}
        name="maxDaysPerYear"
        label="Jumlah hari"
        hint={
          isUnlimited
            ? "Tipe ini tidak dibatasi jatah."
            : code
              ? QUOTA_EDIT_HINT
              : QUOTA_HINT
        }
      >
        {(field) => (
          <Input
            {...field}
            onChange={(event) => field.onChange(toDigits(event.target.value))}
            disabled={isDisabled || isUnlimited}
            inputMode="numeric"
            autoComplete="off"
            placeholder={isUnlimited ? "" : "mis. 12"}
            className="tabular-nums"
          />
        )}
      </ControlField>

      <Controller
        control={form.control}
        name="isPaid"
        render={({ field }) => (
          <ChoiceField
            id="isPaid"
            label="Dibayar"
            value={field.value}
            onValueChange={field.onChange}
            options={PAID_OPTIONS}
            disabled={isDisabled}
          />
        )}
      />

      <Controller
        control={form.control}
        name="isActive"
        render={({ field }) => (
          <div>
            <ChoiceField
              id="isActive"
              label="Status"
              value={field.value}
              onValueChange={field.onChange}
              options={STATUS_OPTIONS}
              disabled={isDisabled}
              hint={STATUS_HINT}
            />
          </div>
        )}
      />

      {code ? (
        <FormField htmlFor="code" label="Kode" hint="Dibuat otomatis.">
          <Input
            readOnly
            variant="filled"
            value={code}
            icon={<Lock />}
            className="cursor-default tabular-nums"
          />
        </FormField>
      ) : null}
    </FormSection>
  );
};
