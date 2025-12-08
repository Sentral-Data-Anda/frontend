import { DatesProvider, MonthPickerInput } from "@mantine/dates";
import { IconCalendarWeek } from "@tabler/icons-react";

import "dayjs/locale/id";

interface PropTypes {
  label: string;
  value: string | null;
  onChange?: (_value: string | null) => void;
  require?: boolean;
  disabled?: boolean;
  withinPortal?: boolean;
}

export const MonthInputComponent = (props: PropTypes) => {
  const {
    label,
    value,
    onChange,
    require = false,
    disabled = false,
    withinPortal = true,
  } = props;
  const icon = <IconCalendarWeek size={18} stroke={1.5} />;

  return (
    <DatesProvider settings={{ locale: "id" }}>
      <MonthPickerInput
        size="xs"
        radius="md"
        value={value}
        onChange={onChange}
        label={label}
        placeholder={label}
        clearable
        withAsterisk={require}
        valueFormat="MMMM YYYY"
        readOnly={disabled}
        // disabled={disabled}
        leftSection={icon}
        popoverProps={{
          withinPortal: withinPortal,
          trapFocus: false,
        }}
        styles={{
          input: {
            minHeight: 32,
            height: 32,
          },
        }}
      />
    </DatesProvider>
  );
};
