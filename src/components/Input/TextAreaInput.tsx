"use client";

import { Textarea } from "@mantine/core";
import { useEffect, useState } from "react";

type Resize = "none" | "both" | "vertical";

interface PropTypes {
  name: string;
  value: string | undefined;
  require?: boolean;
  disabled?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  readOnly?: boolean;
  resize?: Resize;
  description?: boolean;
  maxChar?: number;
}

export const TextAreaInputComponent = (props: PropTypes) => {
  const {
    name,
    value,
    onChange,
    require = false,
    disabled = false,
    resize = "none",
    description = false,
    maxChar,
  } = props;

  const [remaining, setRemaining] = useState<number | undefined>(maxChar);

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
    <Textarea
      label={name}
      size="xs"
      radius="md"
      w={"100%"}
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
      readOnly={disabled}
      autosize
      minRows={3}
      resize={resize}
      maxLength={description ? maxChar : undefined}
      description={
        description
          ? `Maksimal ${maxChar} karakter (tersisa: ${remaining})`
          : undefined
      }
      styles={{
        description: {
          fontStyle: "italic",
          fontSize: 10,
        },
        input: {
          fontSize: 12,
        },
        label: {
          fontSize: 12,
        },
      }}
    />
  );
};
