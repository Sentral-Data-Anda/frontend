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

export const DropdownZoneChurch = (props: PropTypes) => {
  const {
    value,
    onChange,
    withLabel = false,
    require = false,
    disabled = false,
    withinPortal = true,
  } = props;

  const { isLoadingDropdown, selectZoneChurch, fetchDropdownZoneChurch } =
    useZustandStore();

  useEffect(() => {
    if (fetchDropdownZoneChurch) {
      fetchDropdownZoneChurch();
    }
  }, [fetchDropdownZoneChurch]);

  return (
    <DropdownComponent
      placeholder={isLoadingDropdown ? "Loading..." : "Wilayah"}
      data={selectZoneChurch ?? []}
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
