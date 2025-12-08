import { Checkbox } from "@mantine/core";

interface CheckInputProps {
  value: boolean | undefined;
  label: string;
  onChange: (_value: boolean) => void;
  disabled?: boolean;
}

export const CheckInputComponent = (props: CheckInputProps) => {
  const { value, label, onChange, disabled = false } = props;

  console.log("DISABLED COMPONENT", disabled);

  return (
    <Checkbox
      checked={value}
      size="14px"
      color="green"
      label={label}
      onChange={(event) => onChange(event.currentTarget.checked)}
      disabled={disabled}
      styles={{
        label: {
          fontSize: 12,
          paddingLeft: 5,
        },
      }}
    />
  );
};
