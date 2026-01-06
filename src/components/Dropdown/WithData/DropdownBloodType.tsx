import { listBloodType } from "@/utils/general";
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

export const DropdownBloodType = (props: PropTypes) => {
  const {
    pick,
    setPick,
    customData = listBloodType(),
    withLabel = false,
    require = false,
    disabled = false,
    withinPortal = true,
  } = props;

  return (
    <DropdownComponent
      placeholder="Golongan Darah"
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
