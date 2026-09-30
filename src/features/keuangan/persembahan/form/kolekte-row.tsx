"use client";

import type { ReactNode } from "react";
import { Controller, useWatch } from "react-hook-form";

import {
  AmountInput,
  DdlField,
  Input,
  SelectField,
} from "@/components/common/control";
import { LineItemCard, useLineItemErrors } from "@/components/common/form";
import { monthOptions } from "@/lib/date";
import { formatRupiah } from "@/lib/format";

import { ANONYMOUS, PERIOD_NOTE, toItemFromType } from "../model";
import type { OfferingTypeOption } from "../types";
import type { PersembahanForm } from "../use-persembahan-form";

import { ITEM_FIELDS, ROW_LABEL, type ItemField } from "./form-options";
import { JemaatField } from "./jemaat-field";

interface PropTypes {
  form: PersembahanForm;
  index: number;
  types: OfferingTypeOption[];
  typeOptions: readonly { value: string; label: string }[];
  isLoadingTypes: boolean;
  isDisabled: boolean;
  onRemove?: (index: number) => void;
}

export const KolekteRow = (props: PropTypes) => {
  const {
    form,
    index,
    types,
    typeOptions,
    isLoadingTypes,
    isDisabled,
    onRemove,
  } = props;

  const item = useWatch({ control: form.control, name: `items.${index}` });
  const errors = useLineItemErrors(form.control, "items", index, ITEM_FIELDS);

  const onPickType = (next: string) => {
    const type = types.find((row) => String(row.id) === next);

    form.setValue(
      `items.${index}`,
      type
        ? toItemFromType(type, item)
        : { ...item, typePersembahanId: next, typeName: "" },
      { shouldDirty: true },
    );
  };

  const cell = (
    field: ItemField,
    label: string,
    className: string,
    control: ReactNode,
    note?: string,
  ) => (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={errors.idOf(field)} className={ROW_LABEL}>
        {label}
        <span className="sr-only"> baris {index + 1}</span>
      </label>
      {control}
      {note ? (
        <p className="text-muted-foreground mt-1 text-caption">{note}</p>
      ) : null}
    </div>
  );

  if (!item) return null;

  // Tipe yang mewajibkan jemaat tidak bisa anonim, jadi barisnya tidak
  // menjanjikan Anonim sebelum jemaatnya dipilih.
  const giver = item.requiresJemaat
    ? item.jemaatName
    : item.donorName.trim() || ANONYMOUS;

  return (
    <LineItemCard
      index={index}
      title={item.typeName || `Baris ${index + 1}`}
      meta={
        [giver, item.amount ? formatRupiah(Number(item.amount)) : ""]
          .filter(Boolean)
          .join(" · ") || undefined
      }
      removeLabel={`Hapus baris ${index + 1}`}
      isRemoveDisabled={isDisabled}
      onRemove={onRemove}
      messages={errors.messages}
    >
      {cell(
        "typePersembahanId",
        "Tipe",
        "flex-[2_1_13rem]",
        <DdlField
          id={errors.idOf("typePersembahanId")}
          value={item.typePersembahanId}
          onValueChange={onPickType}
          options={typeOptions}
          isLoading={isLoadingTypes}
          disabled={isDisabled}
          placeholder="Pilih tipe"
          emptyMessage="Belum ada tipe persembahan"
          aria-invalid={errors.isInvalid("typePersembahanId") || undefined}
          aria-describedby={errors.messageIdOf("typePersembahanId")}
        />,
      )}

      {item.requiresJemaat
        ? cell(
            "jemaatId",
            "Jemaat",
            "flex-[2_1_14rem]",
            <JemaatField
              form={form}
              index={index}
              id={errors.idOf("jemaatId")}
              isInvalid={errors.isInvalid("jemaatId")}
              describedBy={errors.messageIdOf("jemaatId")}
              isDisabled={isDisabled}
            />,
          )
        : cell(
            "donorName",
            "Nama pemberi",
            "flex-[2_1_14rem]",
            <Controller
              control={form.control}
              name={`items.${index}.donorName`}
              render={({ field }) => (
                <Input
                  {...field}
                  id={errors.idOf("donorName")}
                  maxLength={100}
                  autoComplete="off"
                  autoCapitalize="words"
                  disabled={isDisabled}
                  placeholder={ANONYMOUS}
                  aria-invalid={errors.isInvalid("donorName") || undefined}
                  aria-describedby={errors.messageIdOf("donorName")}
                />
              )}
            />,
          )}

      {item.hasPeriod
        ? cell(
            "period",
            "Periode",
            "flex-[1_1_10rem]",
            <Controller
              control={form.control}
              name={`items.${index}.period`}
              render={({ field }) => (
                <SelectField
                  id={errors.idOf("period")}
                  value={field.value}
                  onValueChange={field.onChange}
                  options={monthOptions()}
                  disabled={isDisabled}
                  placeholder="Pilih bulan"
                  aria-invalid={errors.isInvalid("period") || undefined}
                  aria-describedby={errors.messageIdOf("period")}
                />
              )}
            />,
            PERIOD_NOTE,
          )
        : null}

      {cell(
        "amount",
        "Nominal (Rp)",
        "flex-[1_1_9rem]",
        <Controller
          control={form.control}
          name={`items.${index}.amount`}
          render={({ field }) => (
            <AmountInput
              ref={field.ref}
              id={errors.idOf("amount")}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              disabled={isDisabled}
              maxDigits={13}
              maxFraction={2}
              aria-invalid={errors.isInvalid("amount") || undefined}
              aria-describedby={errors.messageIdOf("amount")}
            />
          )}
        />,
      )}
    </LineItemCard>
  );
};
