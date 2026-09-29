"use client";

import { ComboboxField } from "./combobox-field";

export const METHOD_SUGGESTIONS = [
  "Tunai",
  "Transfer",
  "QRIS",
  "Kartu debit",
  "Lainnya",
] as const;

interface PropTypes {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export const MethodField = (props: PropTypes) => {
  const { id, value, onValueChange, disabled = false, ...aria } = props;

  const suggestions: string[] = [...METHOD_SUGGESTIONS];
  const options = (
    value && !suggestions.includes(value)
      ? [...suggestions, value]
      : suggestions
  ).map((method) => ({ value: method, label: method }));

  return (
    <ComboboxField
      {...aria}
      id={id}
      value={value}
      onValueChange={onValueChange}
      options={options}
      disabled={disabled}
      isClearable
      placeholder="Pilih atau ketik cara"
      emptyMessage="Ketik cara pembayaran"
      onCreate={onValueChange}
    />
  );
};
