"use client";

import { useDdlOptions } from "@/hooks/use-ddl-options";
import { ACCOUNT_TYPE_LABEL, type AccountType } from "@/types/keuangan";

import { DdlField } from "./ddl-field";

type AccountOption = {
  id: number;
  code: string;
  name: string;
  type: AccountType;
  isActive?: boolean;
};

interface PropTypes {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  type?: AccountType;
  /**
   * Shows a clear button. `DdlField` switches to `ComboboxField` for it, so an
   * optional account can actually be unset — a select has no way to say
   * "none" and would strand the first value the user picked.
   */
  isClearable?: boolean;
  disabled?: boolean;
  placeholder?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export const AccountField = (props: PropTypes) => {
  const {
    id,
    value,
    onValueChange,
    type,
    isClearable,
    disabled = false,
    placeholder = "Pilih akun",
    ...aria
  } = props;

  const { rows, isLoading } = useDdlOptions<AccountOption>(
    type ? `account?type=${type}` : "account",
  );
  const options = rows
    .filter((row) => row.isActive !== false || String(row.id) === value)
    .map((row) => ({
      value: String(row.id),
      label:
        row.isActive === false
          ? `${row.code} — ${row.name} (nonaktif)`
          : `${row.code} — ${row.name}`,
      hint: ACCOUNT_TYPE_LABEL[row.type],
    }));

  return (
    <DdlField
      {...aria}
      id={id}
      value={value}
      onValueChange={onValueChange}
      options={options}
      isLoading={isLoading}
      isClearable={isClearable}
      disabled={disabled}
      placeholder={placeholder}
      emptyMessage="Belum ada akun"
    />
  );
};
