"use client";

import { useDdlOptions, type DdlOption } from "@/hooks/use-ddl-options";

import { DdlField } from "./ddl-field";

interface PropTypes {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export const BapelField = (props: PropTypes) => {
  const {
    id,
    value,
    onValueChange,
    disabled = false,
    placeholder = "Pilih komisi",
    ...aria
  } = props;

  const { rows, isLoading } = useDdlOptions<DdlOption>("bapel");
  const options = rows
    .filter((row) => row.isActive !== false || String(row.id) === value)
    .map((row) => ({
      value: String(row.id),
      label: row.isActive === false ? `${row.name} (nonaktif)` : row.name,
      hint: row.code,
    }));

  return (
    <DdlField
      {...aria}
      id={id}
      value={value}
      onValueChange={onValueChange}
      options={options}
      isLoading={isLoading}
      disabled={disabled}
      placeholder={placeholder}
      emptyMessage="Belum ada komisi"
    />
  );
};
