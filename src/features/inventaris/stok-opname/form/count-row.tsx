"use client";

import { Trash2 } from "lucide-react";
import { Controller, useFormState, useWatch } from "react-hook-form";

import { Button, Input } from "@/components/common/control";
import { toDigits } from "@/lib/number";

import { differenceOf, quantityOf } from "../model";
import { DifferenceText } from "../ui";

import type { OpnameForm } from "./form-options";

const FIELDS = ["stockItemId", "physicalQuantity", "note"] as const;

const LABEL = "text-muted-foreground mb-1 block text-caption";

interface PropTypes {
  form: OpnameForm;
  index: number;
  isDisabled: boolean;
  onRemove: (index: number) => void;
}

export const CountRow = (props: PropTypes) => {
  const { form, index, isDisabled, onRemove } = props;

  const line = useWatch({ control: form.control, name: `items.${index}` });
  const { errors } = useFormState({
    control: form.control,
    name: `items.${index}`,
  });
  const lineErrors = errors.items?.[index];
  const idOf = (field: (typeof FIELDS)[number]) => `items.${index}.${field}`;
  const messageIdOf = (field: (typeof FIELDS)[number]) =>
    lineErrors?.[field] ? `${idOf(field)}-error` : undefined;
  const difference = line ? differenceOf(line) : null;
  const isNoteRequired = difference !== null && difference !== 0;
  const messages = FIELDS.flatMap((field) => {
    const message = lineErrors?.[field]?.message;

    return message ? [{ field, message }] : [];
  });

  if (!line) return null;

  return (
    <li className="border-border bg-card flex flex-wrap items-end gap-x-4 gap-y-3 rounded-control border p-3">
      <div className="min-w-0 flex-[1_1_14rem] self-center">
        <p
          id={idOf("stockItemId")}
          tabIndex={-1}
          aria-invalid={lineErrors?.stockItemId ? true : undefined}
          aria-describedby={messageIdOf("stockItemId")}
          className="text-body font-medium wrap-break-word outline-none"
        >
          {line.name}
        </p>
        <p className="text-muted-foreground text-caption wrap-break-word tabular-nums">
          {`${line.code} · Di aplikasi ${quantityOf(line.systemQuantity, line.unit)}`}
        </p>
      </div>

      <div className="flex min-w-0 flex-[3_1_24rem] flex-wrap items-end gap-3">
        <div className="w-24 shrink-0">
          <label htmlFor={idOf("physicalQuantity")} className={LABEL}>
            Fisik<span className="sr-only"> {line.name}</span>
          </label>
          <Controller
            control={form.control}
            name={`items.${index}.physicalQuantity`}
            render={({ field }) => (
              <Input
                {...field}
                id={idOf("physicalQuantity")}
                onChange={(event) =>
                  field.onChange(toDigits(event.target.value, 6))
                }
                inputMode="numeric"
                autoComplete="off"
                aria-invalid={lineErrors?.physicalQuantity ? true : undefined}
                aria-describedby={messageIdOf("physicalQuantity")}
                className="text-right tabular-nums"
              />
            )}
          />
        </div>

        <div className="w-16 shrink-0">
          <span className={LABEL}>Selisih</span>
          <p className="flex h-control items-center">
            <span className="sr-only">Selisih {line.name}: </span>
            <DifferenceText difference={difference} />
          </p>
        </div>

        <div className="min-w-0 flex-[1_1_16rem]">
          <label htmlFor={idOf("note")} className={LABEL}>
            Catatan{isNoteRequired ? "" : " (opsional)"}
            <span className="sr-only"> {line.name}</span>
          </label>
          <Controller
            control={form.control}
            name={`items.${index}.note`}
            render={({ field }) => (
              <Input
                {...field}
                id={idOf("note")}
                maxLength={250}
                autoComplete="off"
                placeholder="Alasan selisih, mis. rusak, terpakai tanpa dicatat"
                aria-invalid={lineErrors?.note ? true : undefined}
                aria-describedby={messageIdOf("note")}
              />
            )}
          />
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Hapus ${line.name}`}
          disabled={isDisabled}
          className="text-destructive shrink-0 cursor-pointer disabled:cursor-not-allowed"
          onClick={() => onRemove(index)}
        >
          <Trash2 aria-hidden />
        </Button>
      </div>

      {messages.length > 0 ? (
        <div className="basis-full space-y-0.5">
          {messages.map(({ field, message }) => (
            <p
              key={field}
              id={`${idOf(field)}-error`}
              className="text-destructive text-body"
            >
              {message}
            </p>
          ))}
        </div>
      ) : null}
    </li>
  );
};
