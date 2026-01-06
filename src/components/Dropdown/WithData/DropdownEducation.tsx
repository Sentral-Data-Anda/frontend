import { listEducation } from "@/utils/general";
import { ComboboxData } from "@mantine/core";
import { DropdownComponent } from "../Dropdown";

interface PropTypes {
  pick: string | null;
  setPick: (_value: string | null) => void;
  withLabel?: boolean;
  require?: boolean;
  disabled?: boolean;
  withinPortal?: boolean;
  customData?: ComboboxData;
}

export const DropdownEducation = (props: PropTypes) => {
  const {
    pick,
    setPick,
    customData = listEducation(),
    withLabel = false,
    require = false,
    disabled = false,
    withinPortal = true,
  } = props;

  return (
    <DropdownComponent
      placeholder="Pendidikan Terakhir"
      data={customData}
      value={pick}
      onChange={setPick}
      withLabel={withLabel}
      require={require}
      disabled={disabled}
      disableSearch
      withinPortal={withinPortal}
    />
  );
};
