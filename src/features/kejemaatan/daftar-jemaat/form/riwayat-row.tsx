"use client";

import type { ReactNode } from "react";
import { Controller, useWatch } from "react-hook-form";

import { DateField, Input, SelectField } from "@/components/common/control";
import { LineItemCard, useLineItemErrors } from "@/components/common/form";
import { formatDate } from "@/lib/format";

import {
  SACRAMENT_ONCE,
  SACRAMENT_TYPE_LABEL,
  type SacramentType,
} from "../types";

import { type JemaatForm } from "./form-options";
import { RIWAYAT_FIELDS, RiwayatCell, type RiwayatField } from "./riwayat-cell";
import { riwayatTitle } from "./riwayat-display";

const SACRAMENT_OPTIONS = Object.entries(SACRAMENT_TYPE_LABEL).map(
  ([value, label]) => ({ value, label }),
);

// model.ts menolak submit tanpa jenis dan tanggal, jadi dua kolom itu saja
// yang berasterisk.
const REQUIRED: readonly RiwayatField[] = ["type", "date"];

const metaOf = (
  row: {
    date: string;
    place: string;
    certificateNumber: string;
    partnerId?: string | null;
    endedAt?: string | null;
  },
  partnerOptions?: Array<{ value: number; label: string }>,
) => {
  const partnerIdNumber = row.partnerId ? Number(row.partnerId) : undefined;
  const partnerLabel = partnerOptions?.find(
    (option) => option.value === partnerIdNumber,
  )?.label;

  return (
    [
      formatDate(row.date),
      row.place,
      row.certificateNumber,
      partnerLabel,
      row.endedAt ? formatDate(row.endedAt) : undefined,
    ]
      .filter(Boolean)
      .join(" · ") || undefined
  );
};

interface PropTypes {
  form: JemaatForm;
  index: number;
  usedTypes: readonly SacramentType[];
  isDisabled: boolean;
  onRemove?: (index: number) => void;
  partnerOptions?: Array<{ value: number; label: string }>;
}

export const RiwayatRow = (props: PropTypes) => {
  const { form, index, usedTypes, isDisabled, onRemove, partnerOptions } =
    props;

  const row = useWatch({ control: form.control, name: `additional.${index}` });
  const errors = useLineItemErrors(
    form.control,
    "additional",
    index,
    RIWAYAT_FIELDS,
  );

  if (!row) return null;

  // Baptis and sidi happen once in a life, so a type already taken by another
  // row is not offered again — the row holding it still sees its own.
  const typeOptions = SACRAMENT_OPTIONS.filter(
    (option) =>
      option.value === row.type ||
      !SACRAMENT_ONCE.includes(option.value as SacramentType) ||
      !usedTypes.includes(option.value as SacramentType),
  );

  const cellOf = (field: RiwayatField, control: ReactNode, note?: string) => (
    <RiwayatCell
      field={field}
      id={errors.idOf(field)}
      index={index}
      isRequired={REQUIRED.includes(field)}
      note={note}
    >
      {control}
    </RiwayatCell>
  );

  return (
    <LineItemCard
      index={index}
      title={riwayatTitle(row.type, index)}
      meta={metaOf(row, partnerOptions)}
      removeLabel={`Hapus riwayat ${index + 1}`}
      isRemoveDisabled={isDisabled}
      onRemove={onRemove}
      messages={errors.messages}
    >
      {cellOf(
        "type",
        <Controller
          control={form.control}
          name={`additional.${index}.type`}
          render={({ field }) => (
            <SelectField
              id={errors.idOf("type")}
              value={field.value}
              onValueChange={field.onChange}
              options={typeOptions}
              disabled={isDisabled}
              placeholder="Pilih jenis"
              aria-invalid={errors.isInvalid("type") || undefined}
              aria-describedby={errors.messageIdOf("type")}
            />
          )}
        />,
      )}

      {cellOf(
        "date",
        <Controller
          control={form.control}
          name={`additional.${index}.date`}
          render={({ field }) => (
            <DateField
              id={errors.idOf("date")}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              disabled={isDisabled}
              label={`Tanggal riwayat ${index + 1}`}
              aria-invalid={errors.isInvalid("date") || undefined}
              aria-describedby={errors.messageIdOf("date")}
            />
          )}
        />,
      )}

      {cellOf(
        "place",
        <Controller
          control={form.control}
          name={`additional.${index}.place`}
          render={({ field }) => (
            <Input
              {...field}
              id={errors.idOf("place")}
              maxLength={100}
              disabled={isDisabled}
              aria-invalid={errors.isInvalid("place") || undefined}
              aria-describedby={errors.messageIdOf("place")}
            />
          )}
        />,
        "Untuk atestasi masuk: nama gereja asal.",
      )}

      {cellOf(
        "certificateNumber",
        <Controller
          control={form.control}
          name={`additional.${index}.certificateNumber`}
          render={({ field }) => (
            <Input
              {...field}
              id={errors.idOf("certificateNumber")}
              maxLength={50}
              disabled={isDisabled}
              aria-invalid={errors.isInvalid("certificateNumber") || undefined}
              aria-describedby={errors.messageIdOf("certificateNumber")}
            />
          )}
        />,
      )}

      {row.type === "NIKAH" &&
        partnerOptions &&
        cellOf(
          "partnerId",
          <Controller
            control={form.control}
            name={`additional.${index}.partnerId`}
            render={({ field }) => (
              <SelectField
                id={errors.idOf("partnerId")}
                value={field.value ? String(field.value) : ""}
                onValueChange={(value) =>
                  field.onChange(value ? Number(value) : "")
                }
                options={[
                  { value: "", label: "Pilih jemaat" },
                  ...partnerOptions.map((option) => ({
                    value: String(option.value),
                    label: option.label,
                  })),
                ]}
                disabled={isDisabled}
                placeholder="Pilih jemaat"
                aria-invalid={errors.isInvalid("partnerId") || undefined}
                aria-describedby={errors.messageIdOf("partnerId")}
              />
            )}
          />,
        )}

      {row.type === "CERAI" &&
        cellOf(
          "endedAt",
          <Controller
            control={form.control}
            name={`additional.${index}.endedAt`}
            render={({ field }) => (
              <DateField
                id={errors.idOf("endedAt")}
                value={field.value ?? ""}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                disabled={isDisabled}
                label={`Tanggal cerai ${index + 1}`}
                aria-invalid={errors.isInvalid("endedAt") || undefined}
                aria-describedby={errors.messageIdOf("endedAt")}
              />
            )}
          />,
        )}
    </LineItemCard>
  );
};
