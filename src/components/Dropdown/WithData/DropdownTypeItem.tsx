"use client";

import { useZustandStore } from "@/hooks";
import { DropdownComponent } from "../Dropdown";
import { useEffect } from "react";

interface PropTypes {
  pick: string | null;
  setPick: (_value: string | null) => void;
}

export const DropdownTypeItem = (props: PropTypes) => {
  const { pick, setPick } = props;

  const { isLoadingDropdown, selectTypeItem, fetchDropdownTypeItem } =
    useZustandStore();

  useEffect(() => {
    if (fetchDropdownTypeItem) {
      fetchDropdownTypeItem();
    }
  }, [fetchDropdownTypeItem]);

  return (
    <DropdownComponent
      placeholder={isLoadingDropdown ? "Loading..." : "Tipe Barang"}
      data={selectTypeItem ?? []}
      value={pick}
      onChange={setPick}
    />
  );
};
