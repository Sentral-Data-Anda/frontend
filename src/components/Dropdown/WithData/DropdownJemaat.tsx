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
}

export const DropdownJemaat = (props: PropTypes) => {
  const {
    value,
    onChange,
    withLabel = false,
    require = false,
    disabled = false,
    withinPortal = true,
  } = props;

  const { isLoadingDropdown, selectJemaat, fetchDropdownJemaat } =
    useZustandStore();

  useEffect(() => {
    if (fetchDropdownJemaat) {
      fetchDropdownJemaat();
    }
  }, [fetchDropdownJemaat]);

  return (
    <DropdownComponent
      placeholder={isLoadingDropdown ? "Loading..." : "Jemaat"}
      data={selectJemaat ?? []}
      value={value}
      onChange={onChange}
      withLabel={withLabel}
      require={require}
      disabled={disabled}
      withinPortal={withinPortal}
    />
  );
};
