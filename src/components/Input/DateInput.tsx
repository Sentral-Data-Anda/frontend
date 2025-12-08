import { DatePickerInput, DatesProvider } from "@mantine/dates";
import { IconCalendarWeek } from "@tabler/icons-react";

import "dayjs/locale/id";

interface PropTypes {
  label: string;
  value: string | null;
  onChange?: (_value: string | null) => void;
  require?: boolean;
  disabled?: boolean;
  withinPortal?: boolean;
  hideOutsideDates?: boolean;
  excludeDate?: (_value: string) => boolean;
  minDate?: string | Date | undefined;
  maxDate?: string | Date | undefined;
}

export const DateInputComponent = (props: PropTypes) => {
  const {
    label,
    value,
    onChange,
    require = false,
    disabled = false,
    withinPortal = true,
    excludeDate,
    minDate,
    maxDate,
    hideOutsideDates = false,
  } = props;
  const icon = <IconCalendarWeek size={18} stroke={1.5} />;
  return (
    <DatesProvider settings={{ locale: "id" }}>
      <DatePickerInput
        w={"100%"}
        date={minDate ? minDate : undefined}
        hideOutsideDates={hideOutsideDates}
        minDate={minDate}
        maxDate={maxDate}
        excludeDate={excludeDate}
        size="xs"
        radius="md"
        value={value}
        onChange={onChange}
        label={label}
        placeholder={label}
        clearable
        withAsterisk={require}
        valueFormat="DD MMMM YYYY"
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
