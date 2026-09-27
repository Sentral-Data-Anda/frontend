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
  disabled: boolean;
  placeholder: string;
  emptyMessage: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export const DdlField = (props: PropTypes) => {
  const { isLoading, placeholder, ...rest } = props;

  return props.options.length > SELECT_LIMIT ? (
    <ComboboxField {...rest} isLoading={isLoading} placeholder={placeholder} />
  ) : (
    <SelectField {...rest} placeholder={isLoading ? "Memuat…" : placeholder} />
  );
};
