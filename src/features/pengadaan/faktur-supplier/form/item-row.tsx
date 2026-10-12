"use client";

import type { ReactNode } from "react";
import { Controller, useWatch, type FieldPath } from "react-hook-form";

import { AccountField, AmountInput, Input } from "@/components/common/control";
import { LineItemCard, useLineItemErrors } from "@/components/common/form";
import { formatAmount } from "@/lib/format";

import type { InvoiceFormValues } from "../model";

import type { InvoiceForm } from "./form-options";

const ITEM_FIELDS = ["name", "amountForeign", "accountId"] as const;

type ItemField = (typeof ITEM_FIELDS)[number];

const LABEL = "text-muted-foreground mb-1 block text-caption";

interface PropTypes {
  form: InvoiceForm;
  index: number;
  isDisabled: boolean;
  onRemove: (index: number) => void;
}

export const ItemRow = (props: PropTypes) => {
  const { form, index, isDisabled, onRemove } = props;

  const path = `items.${index}` as const;
  const line = useWatch({ control: form.control, name: path });
  const errors = useLineItemErrors(form.control, "items", index, ITEM_FIELDS);

  const ariaOf = (field: ItemField) => ({
    id: errors.idOf(field),
    "aria-invalid": errors.isInvalid(field) || undefined,
    "aria-describedby": errors.messageIdOf(field),
  });

  const cell = (
    field: ItemField,
    label: string,
    className: string,
    control: ReactNode,
  ) => (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={errors.idOf(field)} className={LABEL}>
        {label}
        <span className="sr-only"> rincian {index + 1}</span>
      </label>
      {control}
    </div>
  );

  if (!line) return null;

  return (
    <LineItemCard
      index={index}
      title={line.name.trim() || `Rincian ${index + 1}`}
      meta={line.amountForeign ? formatAmount(line.amountForeign) : undefined}
      removeLabel={`Hapus rincian ${index + 1}`}
      isRemoveDisabled={isDisabled}
      onRemove={onRemove}
      messages={errors.messages}
    >
      {cell(
        "name",
        "Nama",
        "flex-[2_1_16rem]",
        <Controller
          control={form.control}
          name={`${path}.name` as FieldPath<InvoiceFormValues>}
          render={({ field }) => (
            <Input
              {...ariaOf("name")}
              ref={field.ref}
              value={String(field.value ?? "")}
              onChange={field.onChange}
              onBlur={field.onBlur}
              disabled={isDisabled}
              maxLength={150}
              placeholder="mis. Kendaraan operasional"
            />
          )}
        />,
      )}

      {cell(
        "amountForeign",
        "Nominal",
        "flex-[1_1_10rem]",
        <Controller
          control={form.control}
          name={`${path}.amountForeign` as FieldPath<InvoiceFormValues>}
          render={({ field }) => (
            <AmountInput
              {...ariaOf("amountForeign")}
              ref={field.ref}
              value={String(field.value ?? "")}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              disabled={isDisabled}
              maxDigits={13}
              maxFraction={4}
            />
          )}
        />,
      )}

      {cell(
        "accountId",
        "Dibebankan ke akun",
        "flex-[2_1_16rem]",
        <Controller
          control={form.control}
          name={`${path}.accountId` as FieldPath<InvoiceFormValues>}
          render={({ field }) => (
            <AccountField
              {...ariaOf("accountId")}
              value={String(field.value ?? "")}
              onValueChange={field.onChange}
              disabled={isDisabled}
              placeholder="Pilih akun beban atau aset"
            />
          )}
        />,
      )}
    </LineItemCard>
  );
};
