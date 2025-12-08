"use client";

import { TextInput } from "@mantine/core";
import { ReactNode, useEffect, useState } from "react";

interface PropTypes {
  name: string;
  value: string | undefined;
  require?: boolean;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  description?: boolean;
  maxChar?: number;
  icon?: ReactNode;
}

export const TextInputComponent = (props: PropTypes) => {
  const {
    name,
    value,
    onChange,
    require = false,
    disabled = false,
    description = false,
    maxChar,
    icon,
  } = props;

  const [remaining, setRemaining] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (description) {
      if (value === "" || value === undefined) {
        setRemaining(maxChar);
      } else if (maxChar !== undefined && value !== undefined) {
        setRemaining(maxChar - value.length);
      }
    }
  }, [value, description]);

  return (
    <TextInput
      label={name}
      size="xs"
      radius="md"
      w={"100%"}
      leftSection={icon}
      placeholder={name}
      value={value}
      onChange={(e) => {
        if (onChange) {
          onChange(e);
        }
        if (maxChar !== undefined) {
          setRemaining(maxChar - e.target.value.length);
        }
      }}
      withAsterisk={require}
      data-autofocus
      // disabled={disabled}
      readOnly={disabled}
      maxLength={description ? maxChar : undefined}
      description={
        description
          ? `Maksimal ${maxChar} karakter (tersisa: ${remaining})`
          : undefined
      }
      styles={{
        description: {
          fontStyle: "italic",
        },
        input: {
          minHeight: 32,
          height: 32,
        },
      }}
    />
  );
};
