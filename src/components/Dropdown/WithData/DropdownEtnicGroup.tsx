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

export const DropdownEtnicGroup = (props: PropTypes) => {
  const {
    value,
    onChange,
    withLabel = false,
    require = false,
    disabled = false,
    withinPortal = true,
  } = props;

  const { isLoadingDropdown, selectEtnicGroup, fetchDropdownEtnicGroup } =
    useZustandStore();

  useEffect(() => {
    if (fetchDropdownEtnicGroup) {
      fetchDropdownEtnicGroup();
    }
  }, [fetchDropdownEtnicGroup]);

  return (
    <DropdownComponent
      placeholder={isLoadingDropdown ? "Loading..." : "Suku"}
      data={selectEtnicGroup ?? []}
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
