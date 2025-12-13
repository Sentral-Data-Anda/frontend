"use client";

import { useZustandStore } from "@/hooks";
import { DropdownComponent } from "../Dropdown";
import { useEffect } from "react";

interface PropTypes {
  value: string | null;
  onChange: (_value: string | null) => void;
  withLabel?: boolean;
  require?: boolean;
  disabled?: boolean;
  withinPortal?: boolean;
}

export const DropdownRolePelayan = (props: PropTypes) => {
  const {
    value,
    onChange,
    withLabel = false,
    require = false,
    disabled = false,
    withinPortal = true,
  } = props;

  const { isLoadingDropdown, selectRolePelayan, fetchDropdownRolePelayan } =
    useZustandStore();

  useEffect(() => {
    if (fetchDropdownRolePelayan) {
      fetchDropdownRolePelayan();
    }
  }, [fetchDropdownRolePelayan]);

  return (
    <DropdownComponent
      placeholder={isLoadingDropdown ? "Loading..." : "Role Pelayan"}
      data={selectRolePelayan ?? []}
      value={value}
      onChange={onChange}
      withLabel={withLabel}
      require={require}
      disabled={disabled}
      disableSearch
      withinPortal={withinPortal}
    />
  );
};
