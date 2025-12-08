import { MantineColor, MantineSize, Switch } from "@mantine/core";

interface PropTypes {
  checked: boolean;
  color: MantineColor;
  label: string;
  disabled?: boolean;
  size?: MantineSize;
  onChange: (value: boolean) => void;
  onLabel?: string;
  offLabel?: string;
}

export const SwitchInputComponent = (props: PropTypes) => {
  const {
    checked,
    color,
    label,
    size = "sm",
    disabled = false,
    onChange,
    onLabel = "ON",
    offLabel = "OFF",
  } = props;

  return (
    <Switch
      checked={checked}
      onLabel={onLabel}
      offLabel={offLabel}
      color={color}
      label={label}
      size={size}
      disabled={disabled}
      labelPosition="left"
      onChange={(event) => onChange(event.currentTarget.checked)}
      styles={{
        label: {
          fontSize: 14,
        },
      }}
    />
  );
};
