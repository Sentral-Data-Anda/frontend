"use client";

import {
  get,
  useFormState,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

export type LineItemMessage = { id: string; message: string };

export const lineItemMessageId = (id: string) => `${id}-error`;

export function useLineItemErrors<T extends FieldValues, F extends string>(
  control: Control<T>,
  name: string,
  index: number,
  fields: readonly F[],
) {
  const path = `${name}.${index}`;
  const { errors } = useFormState({ control, name: path as FieldPath<T> });

  const idOf = (field: F) => `${path}.${field}`;
  const messageOf = (field: F): string | undefined =>
    get(errors, idOf(field))?.message;
  const isInvalid = (field: F) => Boolean(messageOf(field));
  const messageIdOf = (field: F) =>
    isInvalid(field) ? lineItemMessageId(idOf(field)) : undefined;
  const messages: LineItemMessage[] = fields.flatMap((field) => {
    const message = messageOf(field);

    return message ? [{ id: idOf(field), message }] : [];
  });

  return { idOf, isInvalid, messageIdOf, messages };
}
