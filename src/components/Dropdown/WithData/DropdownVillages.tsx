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
  districtsCode: string | null;
}

export const DropdownVillages = (props: PropTypes) => {
  const {
    value,
    onChange,
    withLabel = false,
    require = false,
    disabled = false,
    withinPortal = true,
    districtsCode,
  } = props;

  const { isLoadingVillages, selectVillages, fetchDropdownVillages } =
    useZustandStore();

  useEffect(() => {
    if (fetchDropdownVillages && districtsCode) {
      fetchDropdownVillages({
        districtsCode,
      });
    }
  }, [fetchDropdownVillages, districtsCode]);

  return (
    <DropdownComponent
      placeholder={isLoadingVillages ? "Loading..." : "Kelurahan"}
      data={selectVillages ?? []}
      value={value}
      onChange={onChange}
      withLabel={withLabel}
      require={require}
      disabled={disabled}
      withinPortal={withinPortal}
    />
  );
};
