"use client";

import { useEffect, useRef, useState } from "react";
import {
  useFieldArray,
  type Control,
  type FieldArray,
  type FieldArrayPath,
  type FieldValues,
} from "react-hook-form";

export type RowButton = "up" | "down" | "remove";

export const rowButtonId = (prefix: string, index: number, button: RowButton) =>
  `${prefix}-${index}-${button}`;

const capitalOf = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

interface Options<
  TValues extends FieldValues,
  TName extends FieldArrayPath<TValues>,
> {
  control: Control<TValues>;
  name: TName;
  prefix: string;
  noun: string;
  addId: string;
  pickAddFocus: (index: number) => string;
}

export function useOrderedRows<
  TValues extends FieldValues,
  TName extends FieldArrayPath<TValues>,
>(options: Options<TValues, TName>) {
  const { control, name, prefix, noun, addId, pickAddFocus } = options;

  const rows = useFieldArray({ control, name });
  const [announcement, setAnnouncement] = useState("");
  const focusRef = useRef<string | null>(null);

  const total = rows.fields.length;
  const label = capitalOf(noun);

  const onMove = (from: number, to: number, button: RowButton) => {
    const isEdge = button === "up" ? to === 0 : to === total - 1;
    const kept = isEdge ? (button === "up" ? "down" : "up") : button;

    rows.move(from, to);
    setAnnouncement(`${label} ${from + 1} dipindah ke posisi ${to + 1}`);
    focusRef.current = `#${rowButtonId(prefix, to, kept)}`;
  };

  const onRemove = (index: number) => {
    const remaining = total - 1;

    rows.remove(index);
    setAnnouncement(`${label} ${index + 1} dihapus`);
    focusRef.current =
      remaining > 1
        ? `#${rowButtonId(prefix, Math.min(index, remaining - 1), "remove")}`
        : `#${addId}`;
  };

  const onAdd = (value: FieldArray<TValues, TName>) => {
    rows.append(value, { shouldFocus: false });
    focusRef.current = pickAddFocus(total);
  };

  useEffect(() => {
    if (!focusRef.current) return;

    document.querySelector<HTMLElement>(focusRef.current)?.focus();
    focusRef.current = null;
  }, [rows.fields]);

  return {
    fields: rows.fields,
    total,
    announcement,
    onMove,
    onRemove,
    onAdd,
  };
}
