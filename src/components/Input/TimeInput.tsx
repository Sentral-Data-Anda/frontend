import { TimePicker } from "@mantine/dates";
import { IconClock } from "@tabler/icons-react";

interface PropTypes {
  label: string;
  value: string | undefined;
  onChange?: (_value: string | undefined) => void;
  require?: boolean;
  disabled?: boolean;
}

export const TimeInputComponent = (props: PropTypes) => {
  const { label, value, onChange, require = false, disabled = false } = props;
  const icon = <IconClock size={18} stroke={1.5} />;

  return (
    <TimePicker
      size="xs"
      radius="md"
      value={value}
      onChange={onChange}
      label={label}
      leftSection={icon}
      withDropdown={false}
      withAsterisk={require}
      readOnly={disabled}
      clearable
      styles={{
        input: {
          minHeight: 32,
          height: 32,
          pointerEvents: "unset",
        },
      }}
      popoverProps={{
        middlewares: { flip: false, shift: false },
      }}
    />
  );
};
