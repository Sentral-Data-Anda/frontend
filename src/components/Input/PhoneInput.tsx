import { NumberInput, Text } from "@mantine/core";

interface PropsPhoneInput {
  name: string;
  value: string | undefined;
  disabled?: boolean;
  onChange?: (value: string | number) => void;
  require?: boolean;
}

export const PhoneInputComponent = (props: PropsPhoneInput) => {
  const { name, value, onChange, require = false, disabled = false } = props;
  const icon = (
    <Text size="12px" c="black" opacity={"50%"}>
      +62
    </Text>
  );
  return (
    <NumberInput
      styles={{
        section: {
          margin: 3,
        },
        input: {
          marginLeft: 1,
          minHeight: 32,
          height: 32,
        },
      }}
      leftSection={icon}
      label={name}
      placeholder={name}
      size="xs"
      radius="md"
      w={"100%"}
      value={value}
      onChange={onChange}
      clampBehavior="strict"
      min={1}
      max={999999999999}
      allowNegative={false}
      allowDecimal={false}
      hideControls
      // disabled={disabled}
      withAsterisk={require}
      readOnly={disabled}
    />
  );
};
