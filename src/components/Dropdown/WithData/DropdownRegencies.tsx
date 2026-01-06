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
  provincesCode: string | null;
}

export const DropdownRegencies = (props: PropTypes) => {
  const {
    value,
    onChange,
    withLabel = false,
    require = false,
    disabled = false,
    withinPortal = true,
    provincesCode,
  } = props;

  const { isLoadingRegencies, selectRegencies, fetchDropdownRegencies } =
    useZustandStore();

  useEffect(() => {
    if (fetchDropdownRegencies && provincesCode) {
      fetchDropdownRegencies({
        provincesCode,
      });
    }
  }, [fetchDropdownRegencies, provincesCode]);

  return (
    <DropdownComponent
      placeholder={isLoadingRegencies ? "Loading..." : "Kota/Kabupaten"}
      data={selectRegencies ?? []}
      value={value}
      onChange={onChange}
      withLabel={withLabel}
      require={require}
      disabled={disabled}
      withinPortal={withinPortal}
    />
  );
};
