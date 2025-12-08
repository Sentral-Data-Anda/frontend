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

export const DropdownStatusUser = (props: PropTypes) => {
  const {
    pick,
    setPick,

    withLabel = false,
    require = false,
    disabled = false,
    withinPortal = true,
  } = props;

  const defaultData = [
    {
      label: "Active",
      value: "1",
    },
    {
      label: "Pending",
      value: "0",
    },
    {
      label: "Inactive",
      value: "-1",
    },
  ];

  return (
    <DropdownComponent
      placeholder="Status User"
      data={defaultData}
      value={pick}
      onChange={setPick}
      withLabel={withLabel}
      require={require}
      disabled={disabled}
      withinPortal={withinPortal}
    />
  );
};
