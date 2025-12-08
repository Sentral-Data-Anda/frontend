import { listYears } from "@/utils/general";
import { DropdownComponent } from "../Dropdown";

interface PropTypes {
  pick: string | null;
  setPick: (_value: string | null) => void;
  withLabel?: boolean;
  require?: boolean;
  disabled?: boolean;
  withinPortal?: boolean;
  customStartYear?: number;
}

export const DropdownYear = (props: PropTypes) => {
  const {
    pick,
    setPick,
    customStartYear,
    withLabel = false,
    require = false,
    disabled = false,
    withinPortal = true,
  } = props;

  return (
    <DropdownComponent
      placeholder="Tahun"
      data={listYears(customStartYear)}
      value={pick}
      onChange={setPick}
      withLabel={withLabel}
      require={require}
      disabled={disabled}
      withinPortal={withinPortal}
    />
  );
};
