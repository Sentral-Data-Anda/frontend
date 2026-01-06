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

export const DropdownProvinces = (props: PropTypes) => {
  const {
    value,
    onChange,
    withLabel = false,
    require = false,
    disabled = false,
    withinPortal = true,
  } = props;

  const { isLoadingDropdown, selectProvinces, fetchDropdownProvinces } =
    useZustandStore();

  useEffect(() => {
    if (fetchDropdownProvinces) {
      fetchDropdownProvinces();
    }
  }, [fetchDropdownProvinces]);

  return (
    <DropdownComponent
      placeholder={isLoadingDropdown ? "Loading..." : "Provinsi"}
      data={selectProvinces ?? []}
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
