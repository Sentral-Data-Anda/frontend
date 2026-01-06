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
  regenciesCode: string | null;
}

export const DropdownDistricts = (props: PropTypes) => {
  const {
    value,
    onChange,
    withLabel = false,
    require = false,
    disabled = false,
    withinPortal = true,
    regenciesCode,
  } = props;

  const { isLoadingDistrict, selectDistricts, fetchDropdownDistricts } =
    useZustandStore();

  useEffect(() => {
    if (fetchDropdownDistricts && regenciesCode) {
      fetchDropdownDistricts({
        regenciesCode,
      });
    }
  }, [fetchDropdownDistricts, regenciesCode]);

  return (
    <DropdownComponent
      placeholder={isLoadingDistrict ? "Loading..." : "Kecamatan"}
      data={selectDistricts ?? []}
      value={value}
      onChange={onChange}
      withLabel={withLabel}
      require={require}
      disabled={disabled}
      withinPortal={withinPortal}
    />
  );
};
