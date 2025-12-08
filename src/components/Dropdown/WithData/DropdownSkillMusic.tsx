"use client";

import { useZustandStore } from "@/hooks";
import { DropdownComponent } from "../Dropdown";
import { useEffect } from "react";

interface PropTypes {
  pick: string | null;
  setPick: (_value: string | null) => void;
}

export const DropdownSkillMusic = (props: PropTypes) => {
  const { pick, setPick } = props;

  const { isLoadingDropdown, selectSkillMusic, fetchDropdownSkillMusic } =
    useZustandStore();

  useEffect(() => {
    if (fetchDropdownSkillMusic) {
      fetchDropdownSkillMusic();
    }
  }, [fetchDropdownSkillMusic]);

  return (
    <DropdownComponent
      placeholder={isLoadingDropdown ? "Loading..." : "Skill Musik"}
      data={selectSkillMusic ?? []}
      value={pick}
      onChange={setPick}
    />
  );
};
