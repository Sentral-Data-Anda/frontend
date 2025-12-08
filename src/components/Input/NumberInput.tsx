import { NumberInput } from "@mantine/core";

interface PropTypes {
  name: string;
  value: string | undefined | number;
  require?: boolean;
  disabled?: boolean;
  onChange?: (_value: string | number) => void;
  readOnly?: boolean;
  allowNegative?: boolean;
  allowDecimal?: boolean;
}

export const NumberInputComponent = (props: PropTypes) => {
  const {
    name,
    value,
    onChange,
    require = false,
    disabled = false,
    allowNegative = false,
    allowDecimal = false,
  } = props;
  return (
    <NumberInput
      label={name}
      placeholder={name}
      inputMode="numeric"
      size="xs"
      radius="md"
      w={"100%"}
      value={value}
      onChange={onChange}
      withAsterisk={require}
      readOnly={disabled}
      allowNegative={allowNegative}
      allowDecimal={allowDecimal}
      clampBehavior="strict"
      hideControls
      thousandSeparator=" "
      styles={{
        input: {
          minHeight: 32,
          height: 32,
        },
      }}
    />
  );
};
