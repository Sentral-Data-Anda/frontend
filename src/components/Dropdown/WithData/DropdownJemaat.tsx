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
  status?: string;
  register?: string;
  type?: string[];
}

export const DropdownJemaat = (props: PropTypes) => {
  const {
    value,
    onChange,
    withLabel = false,
    require = false,
    disabled = false,
    withinPortal = true,
    status,
    type,
    register,
  } = props;

  const { isLoadingDropdown, selectJemaat, fetchDropdownJemaat } =
    useZustandStore();

  useEffect(() => {
    if (fetchDropdownJemaat) {
      fetchDropdownJemaat({
        status,
        type,
        register,
      });
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
