"use client";

import { ComboboxField } from "./combobox-field";
import { SelectField, type SelectOption } from "./select-field";

export const SELECT_LIMIT = 15;

interface PropTypes {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  isLoading: boolean;
  isClearable?: boolean;
  disabled: boolean;
  placeholder: string;
  emptyMessage: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export const DdlField = (props: PropTypes) => {
  const { isLoading, placeholder, isClearable, ...rest } = props;

  // SelectField tidak punya tombol kosongkan; pilihan yang boleh dikosongkan
  // memakai ComboboxField berapa pun jumlahnya, bukan diam-diam tanpa tombol.
  return isClearable || props.options.length > SELECT_LIMIT ? (
    <ComboboxField
      {...rest}
      isClearable={isClearable}
      isLoading={isLoading}
      placeholder={placeholder}
    />
  ) : (
    <SelectField {...rest} placeholder={isLoading ? "Memuat…" : placeholder} />
  );
};
