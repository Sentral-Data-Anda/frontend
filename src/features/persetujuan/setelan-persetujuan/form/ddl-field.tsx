"use client";

import {
  ComboboxField,
  SelectField,
  type SelectOption,
} from "@/components/common/control";

import { SELECT_LIMIT } from "./form-options";

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
