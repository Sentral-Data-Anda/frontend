"use client";

import { Controller, useWatch } from "react-hook-form";

import { AmountInput, Input } from "@/components/common/control";
import { Badge } from "@/components/common/display";
import { LineItemCard, useLineItemErrors } from "@/components/common/form";
import { formatAmount, formatNumber } from "@/lib/format";

import { TARGET_LABEL, lineValueText, type LineTarget } from "../model";

import { LINE_FIELDS, type ReturnForm } from "./form-options";

const LABEL = "text-muted-foreground mb-1 block text-caption";

interface PropTypes {
  form: ReturnForm;
  index: number;
  exchangeRate: string;
  isDisabled: boolean;
  onRemove: (index: number) => void;
}

export const ItemRow = (props: PropTypes) => {
  const { form, index, exchangeRate, isDisabled, onRemove } = props;

  const line = useWatch({ control: form.control, name: `items.${index}` });
  const errors = useLineItemErrors(form.control, "items", index, LINE_FIELDS);

  if (!line) return null;

  const value = exchangeRate ? lineValueText(line, exchangeRate) : null;
  const target = line.target as LineTarget | "";
  const received = `Diterima ${formatNumber(line.quantityReceived)}${line.unit ? ` ${line.unit}` : ""}`;

  return (
    <LineItemCard
      index={index}
      title={
        <span className="flex flex-wrap items-center gap-2">
          {line.name}
          {target ? (
            <Badge variant="outline">{TARGET_LABEL[target]}</Badge>
          ) : null}
        </span>
      }
      meta={`${received} · Nilai retur ${value === null ? "—" : formatAmount(value)}`}
      removeLabel={`Keluarkan ${line.name} dari retur`}
      isRemoveDisabled={isDisabled}
      onRemove={onRemove}
      messages={errors.messages}
    >
      <div className="w-24 shrink-0">
        <label htmlFor={errors.idOf("quantity")} className={LABEL}>
          Jumlah<span className="sr-only"> {line.name}</span>
        </label>
        <Controller
          control={form.control}
          name={`items.${index}.quantity`}
          render={({ field }) => (
            <AmountInput
              ref={field.ref}
              id={errors.idOf("quantity")}
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              maxDigits={6}
              aria-invalid={errors.isInvalid("quantity") || undefined}
              aria-describedby={errors.messageIdOf("quantity")}
            />
          )}
        />
      </div>

      <div className="min-w-0 flex-[1_1_16rem]">
        <label htmlFor={errors.idOf("reason")} className={LABEL}>
          Alasan baris (opsional)
          <span className="sr-only"> {line.name}</span>
        </label>
        <Controller
          control={form.control}
          name={`items.${index}.reason`}
          render={({ field }) => (
            <Input
              {...field}
              id={errors.idOf("reason")}
              maxLength={250}
              autoComplete="off"
              placeholder="Mis. sandaran retak"
              aria-invalid={errors.isInvalid("reason") || undefined}
              aria-describedby={errors.messageIdOf("reason")}
            />
          )}
        />
      </div>
    </LineItemCard>
  );
};
