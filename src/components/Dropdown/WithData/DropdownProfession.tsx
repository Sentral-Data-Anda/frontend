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

export const DropdownProfession = (props: PropTypes) => {
  const {
    value,
    onChange,
    withLabel = false,
    require = false,
    disabled = false,
    withinPortal = true,
  } = props;

  const { isLoadingDropdown, selectProfession, fetchDropdownProfession } =
    useZustandStore();

  useEffect(() => {
    if (fetchDropdownProfession) {
      fetchDropdownProfession();
    }
  }, [fetchDropdownProfession]);

  return (
    <DropdownComponent
      placeholder={isLoadingDropdown ? "Loading..." : "Pekerjaan"}
      data={selectProfession ?? []}
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
