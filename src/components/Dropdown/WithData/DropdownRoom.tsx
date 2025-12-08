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

export const DropdownRoom = (props: PropTypes) => {
  const {
    value,
    onChange,
    withLabel = false,
    require = false,
    disabled = false,
    withinPortal = true,
  } = props;

  const { isLoadingDropdown, selectRoom, fetchDropdownRoom } =
    useZustandStore();

  useEffect(() => {
    if (fetchDropdownRoom) {
      fetchDropdownRoom();
    }
  }, [fetchDropdownRoom]);

  return (
    <DropdownComponent
      placeholder={isLoadingDropdown ? "Loading..." : "Ruangan"}
      data={selectRoom ?? []}
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
