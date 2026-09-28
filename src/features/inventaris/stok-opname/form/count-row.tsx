"use client";

import { Trash2 } from "lucide-react";
import { Controller, useFormState, useWatch } from "react-hook-form";

import { Button, Input } from "@/components/common/control";
import { toDigits } from "@/lib/number";
import { cn } from "@/lib/utils";

import { differenceOf, quantityOf } from "../model";
import { DifferenceText } from "../ui";

import type { OpnameForm } from "./form-options";

const FIELDS = ["stockItemId", "physicalQuantity", "note"] as const;

interface PropTypes {
  form: OpnameForm;
  index: number;
  isTable: boolean;
  isDisabled: boolean;
  onRemove: (index: number) => void;
}

export const CountRow = (props: PropTypes) => {
  const { form, index, isTable, isDisabled, onRemove } = props;

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
  const labelClass = isTable
    ? "sr-only"
    : "text-muted-foreground mb-1 block text-caption";
  const messages = FIELDS.flatMap((field) => {
    const message = lineErrors?.[field]?.message;

    return message ? [{ field, message }] : [];
  });

  if (!line) return null;

  return (
    <li
      className={cn(
        isTable
          ? "border-border col-span-full grid grid-cols-subgrid items-start gap-y-1.5 border-t px-3 py-2.5"
          : "border-border bg-card grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-3 rounded-control border p-3",
      )}
    >
      <div className="min-w-0 self-center">
        <p
          id={idOf("stockItemId")}
          tabIndex={-1}
          aria-invalid={lineErrors?.stockItemId ? true : undefined}
          aria-describedby={messageIdOf("stockItemId")}
          className="truncate text-body font-medium outline-none"
          title={line.name}
        >
          {line.name}
        </p>
        <p className="text-muted-foreground truncate text-caption tabular-nums">
          {`${line.code} · Di aplikasi ${quantityOf(line.systemQuantity, line.unit)}`}
        </p>
      </div>

      {isTable ? null : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Hapus ${line.name}`}
          disabled={isDisabled}
          className="text-destructive cursor-pointer disabled:cursor-not-allowed"
          onClick={() => onRemove(index)}
        >
          <Trash2 aria-hidden />
        </Button>
      )}

      <div
        className={
          isTable ? "contents" : "col-span-full grid grid-cols-2 gap-x-3"
        }
      >
        <div>
          <label htmlFor={idOf("physicalQuantity")} className={labelClass}>
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

        <div
          className={isTable ? "flex h-control items-center justify-end" : ""}
        >
          <span className={labelClass}>Selisih</span>
          <p className={isTable ? "" : "flex h-control items-center"}>
            <span className="sr-only">Selisih {line.name}: </span>
            <DifferenceText difference={difference} />
          </p>
        </div>
      </div>

      <div className={isTable ? "min-w-0" : "col-span-full"}>
        <label htmlFor={idOf("note")} className={labelClass}>
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

      {isTable ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Hapus ${line.name}`}
          disabled={isDisabled}
          className="text-destructive cursor-pointer disabled:cursor-not-allowed"
          onClick={() => onRemove(index)}
        >
          <Trash2 aria-hidden />
        </Button>
      ) : null}

      {messages.length > 0 ? (
        <div className="col-span-full space-y-0.5">
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
