import { PinInput } from "@mantine/core";

interface OTPInputProps {
  disabled: boolean;
  onComplete: (value: string) => void;
}

export const OTPInputComponent = (props: OTPInputProps) => {
  const { disabled = false, onComplete } = props;

  return (
    <PinInput
      length={6}
      type="number"
      inputMode="numeric"
      onComplete={onComplete}
      disabled={disabled}
    />
  );
};
