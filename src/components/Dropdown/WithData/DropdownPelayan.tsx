"use client";

import { useEffect } from "react";
import { ComboboxData } from "@mantine/core";
import { DropdownComponent } from "../Dropdown";
import { useZustandStore } from "@/hooks";

interface PropTypes {
  value: string | null;
  onChange: (_value: string | null) => void;
  withLabel?: boolean;
  require?: boolean;
  disabled?: boolean;
  withinPortal?: boolean;
  customData?: ComboboxData;
}

export const DropdownPelayan = (props: PropTypes) => {
  const {
    value,
    onChange,
    withLabel = false,
    require = false,
    disabled = false,
    withinPortal = true,
    customData = [],
  } = props;

  const { isLoadingDropdown, selectPelayan, fetchDropdownPelayan } =
    useZustandStore();

  useEffect(() => {
    if (fetchDropdownPelayan) {
      fetchDropdownPelayan();
    }
  }, [fetchDropdownPelayan]);

  return (
    <DropdownComponent
      placeholder={isLoadingDropdown ? "Loading..." : "Pelayan"}
      data={customData ? customData : selectPelayan}
      value={value}
      onChange={onChange}
      withLabel={withLabel}
      require={require}
      disabled={disabled}
      withinPortal={withinPortal}
    />
  );
};
