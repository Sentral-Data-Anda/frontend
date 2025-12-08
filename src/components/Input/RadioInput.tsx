import { Radio } from "@mantine/core";

interface PropTypes {
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  name: string;
}

export const RadioInputComponent = (props: PropTypes) => {
  const { name, onChange, disabled = false, value } = props;

  return (
    <Radio
      value={value}
      variant="outline"
      onChange={(event) => onChange?.(event.currentTarget.value)}
      label={name}
      disabled={disabled}
      styles={{
        radio: {
          width: 15,
          height: 15,
        },
        label: {
          fontSize: 12,
        },
        inner: {
          width: 15,
          height: 15,
        },
        body: {
          alignItems: "center",
        },
      }}
    />
  );
};
