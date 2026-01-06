import { DropdownComponent } from "../Dropdown";
import { ComboboxData } from "@mantine/core";

interface PropTypes {
  pick: string | null;
  setPick: (_value: string | null) => void;
  withLabel?: boolean;
  require?: boolean;
  disabled?: boolean;
  withinPortal?: boolean;
  customData?: ComboboxData;
}

export const DropdownTypeJemaat = (props: PropTypes) => {
  const {
    pick,
    setPick,
    withLabel = false,
    require = false,
    disabled = false,
    withinPortal = true,
  } = props;

  return (
    <DropdownComponent
      placeholder="Status Jemaat"
      data={["ANGGOTA", "SIMPATISAN", "ANAK"]}
      value={pick}
      onChange={setPick}
      withLabel={withLabel}
      require={require}
      disabled={disabled}
      withinPortal={withinPortal}
      disableSearch
    />
  );
};
