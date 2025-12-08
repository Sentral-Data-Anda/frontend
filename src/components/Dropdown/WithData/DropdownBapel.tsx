"use client";

import { useEffect } from "react";
import { DropdownComponent } from "../Dropdown";
import { useZustandStore } from "@/hooks";

interface PropTypes {
  value: string | null;
  onChange: (_value: string | null) => void;
  withLabel?: boolean;
  require?: boolean;
  disabled?: boolean;
  withinPortal?: boolean;
  customLabel?: string;
}

export const DropdownBapel = (props: PropTypes) => {
  const {
    value,
    onChange,
    withLabel = false,
    require = false,
    disabled = false,
    withinPortal = true,
    customLabel = "Bapel",
  } = props;

  const { isLoadingDropdown, selectBapel, fetchDropdownBapel } =
    useZustandStore();

  useEffect(() => {
    if (fetchDropdownBapel) {
      fetchDropdownBapel();
    }
  }, [fetchDropdownBapel]);

  return (
    <DropdownComponent
      placeholder={isLoadingDropdown ? "Loading..." : customLabel}
      data={selectBapel ?? []}
      value={value}
      onChange={onChange}
      withLabel={withLabel}
      require={require}
      disabled={disabled}
      withinPortal={withinPortal}
      disableSearch
    />
  );
};
