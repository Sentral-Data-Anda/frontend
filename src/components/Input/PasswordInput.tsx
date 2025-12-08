import { PasswordInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPassword } from "@tabler/icons-react";

interface PropTypes {
  name: string;
  value: string | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: boolean;
  disabled?: boolean;
  require?: boolean;
}

export const PasswordInputComponent = (props: PropTypes) => {
  const {
    name,
    value,
    onChange,
    require = false,
    error = false,
    disabled = false,
  } = props;
  const [visible, { toggle }] = useDisclosure(false);

  return (
    <PasswordInput
      label={name}
      leftSection={<IconPassword size={16} />}
      size="xs"
      radius="md"
      placeholder={name}
      value={value}
      onChange={onChange}
      visible={visible}
      onVisibilityChange={toggle}
      error={error}
      readOnly={disabled}
      withAsterisk={require}
      styles={{
        input: {
          minHeight: 32,
          height: 32,
        },
      }}
    />
  );
};
