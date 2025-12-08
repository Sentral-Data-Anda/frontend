"use client";

import { DropdownComponent } from "../Dropdown";
import { useEffect, useState } from "react";
import { ComboboxItem } from "@mantine/core";
import { useZustandStore } from "@/hooks";

interface PropTypes {
  pick: string | null;
  setPick: (_value: string | null) => void;
  withLabel?: boolean;
  require?: boolean;
  disabled?: boolean;
  withinPortal?: boolean;
}

export const DropdownRoleUser = (props: PropTypes) => {
  const {
    pick,
    setPick,
    withLabel = false,
    require = false,
    disabled = false,
    withinPortal = true,
  } = props;

  const {
    isLoadingDropdown,
    detailUser,
    selectRoleUser,
    fetchDropdownRoleUser,
  } = useZustandStore();

  const isAdmin = detailUser?.roleUser?.name === "Administrator";

  const [formatSelect, setFormatSelect] = useState<ComboboxItem[]>([]);

  useEffect(() => {
    if (fetchDropdownRoleUser) {
      fetchDropdownRoleUser();
    }
  }, [fetchDropdownRoleUser]);

  useEffect(() => {
    if (selectRoleUser?.length > 0) {
      const select = selectRoleUser?.map((value) => {
        return {
          ...value,
          disabled:
            value.label === "Administrator" ? (isAdmin ? false : true) : false,
        };
      });
      setFormatSelect(select);
    }
  }, [selectRoleUser]);

  return (
    <DropdownComponent
      placeholder={isLoadingDropdown ? "Loading..." : "Role"}
      data={formatSelect ?? []}
      value={pick}
      onChange={setPick}
      withLabel={withLabel}
      require={require}
      disabled={disabled}
      withinPortal={withinPortal}
    />
  );
};
