"use client";

import { useWatch, type UseFormReturn } from "react-hook-form";

import {
  Button,
  ChoiceField,
  DateField,
  DdlField,
  Input,
  optionsOf,
} from "@/components/common/control";
import { ControlField, FormSection, FormWide } from "@/components/common/form";
import { useDdlOptions } from "@/hooks/use-ddl-options";
import { endOfYearIso } from "@/lib/date";
import { formatWeekday } from "@/lib/format";

import {
  PATTERN_LABEL,
  monthlyLabel,
  weekOfMonth,
  type GiliranSettings,
  type RotationPattern,
} from "./model";

const PATTERN_OPTIONS = optionsOf(PATTERN_LABEL);

interface PropTypes {
  form: UseFormReturn<GiliranSettings>;
  isLocked: boolean;
  isDisabled: boolean;
  isBuilding: boolean;
  onBuild: () => void;
  onEdit: () => void;
}

export const SettingsSection = (props: PropTypes) => {
  const { form, isLocked, isDisabled, isBuilding, onBuild, onEdit } = props;

  const [pattern, startDate] = useWatch({
    control: form.control,
    name: ["pattern", "startDate"],
  });
  const types = useDdlOptions("type-ibadah", "id");
  const zones = useDdlOptions("zone-church", "id");
  const isOff = isLocked || isDisabled || isBuilding;
  const dateMax = endOfYearIso(1);

  const patternHint = !startDate
    ? "Hari dan pekan diambil dari tanggal mulai."
    : pattern === "WEEKLY"
      ? `Setiap ${formatWeekday(startDate)}.`
      : weekOfMonth(startDate) > 4
        ? "Pola bulanan memakai tanggal mulai 1–28."
        : `${monthlyLabel(startDate)} setiap bulan.`;

  const onPickPattern = (value: string) =>
    form.setValue("pattern", value as RotationPattern, {
      shouldDirty: true,
      shouldValidate: form.formState.isSubmitted,
    });

  return (
    <FormSection
      legend="Pengaturan"
      note="Pilih tipe dan wilayah; jam dan tanggal mulai terisi dari ibadah terakhir wilayah itu."
      disabled={isDisabled}
    >
      <ControlField
        control={form.control}
        name="typeIbadahId"
        label="Tipe ibadah"
      >
        {(field) => (
          <DdlField
            value={field.value}
            onValueChange={field.onChange}
            options={types.options}
            isLoading={types.isLoading}
            disabled={isOff}
            placeholder="Pilih tipe ibadah"
            emptyMessage="Belum ada tipe ibadah aktif. Tambahkan di menu Tipe Ibadah."
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="zoneChurchId" label="Wilayah">
        {(field) => (
          <DdlField
            value={field.value}
            onValueChange={field.onChange}
            options={zones.options}
            isLoading={zones.isLoading}
            disabled={isOff}
            placeholder="Pilih wilayah"
            emptyMessage="Belum ada wilayah aktif"
          />
        )}
      </ControlField>

      <ControlField control={form.control} name="startTime" label="Jam mulai">
        {(field) => <Input {...field} type="time" disabled={isOff} />}
      </ControlField>

      <ControlField
        control={form.control}
        name="endTime"
        label="Jam selesai"
        hint="Kosongkan bila belum pasti."
      >
        {(field) => <Input {...field} type="time" disabled={isOff} />}
      </ControlField>

      <ControlField
        control={form.control}
        name="startDate"
        label="Tanggal mulai"
      >
        {(field) => (
          <DateField
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={isOff}
            variant="dekat"
            max={dateMax}
            label="Tanggal mulai"
          />
        )}
      </ControlField>

      <div>
        <ChoiceField
          id="pattern"
          label="Pola"
          value={pattern}
          onValueChange={onPickPattern}
          options={PATTERN_OPTIONS}
          disabled={isOff}
          hint={patternHint}
        />
      </div>

      <ControlField
        control={form.control}
        name="count"
        label="Jumlah ibadah"
        hint="1 sampai 60."
      >
        {(field) => (
          <Input
            {...field}
            onChange={(event) =>
              field.onChange(event.target.value.replace(/\D/g, "").slice(0, 2))
            }
            inputMode="numeric"
            autoComplete="off"
            maxLength={2}
            disabled={isOff}
            className="tabular-nums"
          />
        )}
      </ControlField>

      <FormWide>
        {isLocked ? (
          <Button
            type="button"
            variant="outline"
            disabled={isDisabled}
            onClick={onEdit}
          >
            Ubah pengaturan
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled={isDisabled || isBuilding}
            onClick={onBuild}
          >
            {isBuilding ? "Menyusun…" : "Buat pratinjau"}
          </Button>
        )}
      </FormWide>
    </FormSection>
  );
};
