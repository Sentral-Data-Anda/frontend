"use client";

import { Controller, useWatch } from "react-hook-form";

import { AmountInput, BapelField } from "@/components/common/control";
import { LineItemCard, useLineItemErrors } from "@/components/common/form";
import { formatAmount } from "@/lib/format";

import { type BatchForm } from "./form-options";

const FIELDS = ["bapelId", "amount"] as const;

const LABEL = "text-muted-foreground mb-1 block text-caption";

interface PropTypes {
  form: BatchForm;
  index: number;
  isDisabled: boolean;
  onRemove: (index: number) => void;
}

export const BatchRow = (props: PropTypes) => {
  const { form, index, isDisabled, onRemove } = props;

  const errors = useLineItemErrors(form.control, "items", index, FIELDS);
  const amount = useWatch({
    control: form.control,
    name: `items.${index}.amount`,
  });

  const ariaOf = (field: (typeof FIELDS)[number]) => ({
    id: errors.idOf(field),
    "aria-invalid": errors.isInvalid(field) || undefined,
    "aria-describedby": errors.messageIdOf(field),
  });

  return (
    <LineItemCard
      index={index}
      title={`Badan pelayanan ${index + 1}`}
      meta={amount ? formatAmount(amount) : undefined}
      removeLabel={`Hapus baris ${index + 1}`}
      isRemoveDisabled={isDisabled}
      onRemove={onRemove}
      messages={errors.messages}
    >
      <div className="min-w-0 flex-[2_1_16rem]">
        <label htmlFor={errors.idOf("bapelId")} className={LABEL}>
          Badan pelayanan
          <span className="sr-only"> baris {index + 1}</span>
        </label>

        <Controller
          control={form.control}
          name={`items.${index}.bapelId`}
          render={({ field }) => (
            <BapelField
              {...ariaOf("bapelId")}
              value={field.value}
              onValueChange={field.onChange}
              disabled={isDisabled}
            />
          )}
        />
      </div>

      <div className="min-w-0 flex-[1_1_12rem]">
        <label htmlFor={errors.idOf("amount")} className={LABEL}>
          Pagu (Rp)
          <span className="sr-only"> baris {index + 1}</span>
        </label>

        <Controller
          control={form.control}
          name={`items.${index}.amount`}
          render={({ field }) => (
            <AmountInput
              {...ariaOf("amount")}
              ref={field.ref}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              disabled={isDisabled}
              maxDigits={13}
              maxFraction={2}
            />
          )}
        />
      </div>
    </LineItemCard>
  );
};
