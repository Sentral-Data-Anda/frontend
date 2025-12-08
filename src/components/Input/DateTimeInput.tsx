import { DatesProvider, DateTimePicker } from "@mantine/dates";
import { IconCalendarWeek } from "@tabler/icons-react";

import "dayjs/locale/id";

interface PropTypes {
  label: string;
  value: string | null;
  onChange?: (_value: string | null) => void;
  require?: boolean;
  disabled?: boolean;
  excludeDate?: (_value: string) => boolean;
}

export const DateTimeInputComponent = (props: PropTypes) => {
  const {
    label,
    value,
    onChange,
    require = false,
    disabled = false,
    excludeDate,
  } = props;
  const icon = <IconCalendarWeek size={18} stroke={1.5} />;

  return (
    <DatesProvider settings={{ locale: "id" }}>
      <DateTimePicker
        excludeDate={excludeDate}
        highlightToday
        hideOutsideDates
        size="xs"
        radius="md"
        value={value}
        onChange={onChange}
        label={label}
        placeholder={label}
        clearable
        withAsterisk={require}
        valueFormat="DD MMMM YYYY HH:mm"
        readOnly={disabled}
        leftSection={icon}
        timePickerProps={{
          withDropdown: true,
          popoverProps: { withinPortal: false },
          format: "24h",
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
