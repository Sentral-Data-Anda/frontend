"use client";

import { Controller, useWatch } from "react-hook-form";

import { AmountInput, Input } from "@/components/common/control";
import { LineItemCard, useLineItemErrors } from "@/components/common/form";
import { formatRupiah } from "@/lib/format";
import { lineAmount } from "@/lib/number";

import { LINE_FIELDS, type RequestForm } from "./form-options";

const LABEL = "text-muted-foreground mb-1 block text-caption";

interface PropTypes {
  form: RequestForm;
  index: number;
  isDisabled: boolean;
  isRemovable: boolean;
  onRemove: (index: number) => void;
}

export const ItemRow = (props: PropTypes) => {
  const { form, index, isDisabled, isRemovable, onRemove } = props;

  const line = useWatch({ control: form.control, name: `items.${index}` });
  const errors = useLineItemErrors(form.control, "items", index, LINE_FIELDS);
  const name = line?.name.trim() || `Barang ${index + 1}`;
  const subtotal = line
    ? lineAmount(line.quantity, line.estimatedUnitPrice)
    : null;

  return (
    <LineItemCard
      index={index}
      title={name}
      meta={`Subtotal ${subtotal === null ? "—" : formatRupiah(subtotal)}`}
      removeLabel={`Hapus ${name}`}
      isRemoveDisabled={isDisabled}
      onRemove={isRemovable ? onRemove : undefined}
      messages={errors.messages}
    >
      <div className="min-w-0 flex-[2_1_16rem]">
        <label htmlFor={errors.idOf("name")} className={LABEL}>
          Nama barang
        </label>
        <Controller
          control={form.control}
          name={`items.${index}.name`}
          render={({ field }) => (
            <Input
              {...field}
              id={errors.idOf("name")}
              maxLength={150}
              autoComplete="off"
              placeholder="Mis. Matras gulung"
              aria-invalid={errors.isInvalid("name") || undefined}
              aria-describedby={errors.messageIdOf("name")}
            />
          )}
        />
      </div>

      <div className="w-24 shrink-0">
        <label htmlFor={errors.idOf("quantity")} className={LABEL}>
          Jumlah<span className="sr-only"> {name}</span>
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

      <div className="min-w-0 flex-[1_1_10rem]">
        <label htmlFor={errors.idOf("estimatedUnitPrice")} className={LABEL}>
          Perkiraan harga satuan (Rp)
          <span className="sr-only"> {name}, termasuk PPN</span>
        </label>
        <Controller
          control={form.control}
          name={`items.${index}.estimatedUnitPrice`}
          render={({ field }) => (
            <AmountInput
              ref={field.ref}
              id={errors.idOf("estimatedUnitPrice")}
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              maxDigits={13}
              aria-invalid={errors.isInvalid("estimatedUnitPrice") || undefined}
              aria-describedby={errors.messageIdOf("estimatedUnitPrice")}
            />
          )}
        />
      </div>
    </LineItemCard>
  );
};
