"use client";

import { useZustandStore } from "@/hooks";
import { Autocomplete } from "@mantine/core";
import { ReactNode, useEffect, useState } from "react";

interface PropTypes {
  name: string;
  value: string | undefined;
  require?: boolean;
  disabled?: boolean;
  onChange?: (_value: string | undefined) => void;
  description?: boolean;
  maxChar?: number;
  icon?: ReactNode;
  type?: string[];
  status?: string;
}

export const DropdownAutoComplete = (props: PropTypes) => {
  const {
    name,
    value,
    onChange,
    require = false,
    disabled = false,
    description = false,
    maxChar,
    icon,
    type,
    status,
  } = props;

  console.log("TYPE", type);

  const { isLoadingDropdown, selectJemaat, fetchDropdownJemaat } =
    useZustandStore();

  useEffect(() => {
    if (fetchDropdownJemaat) {
      fetchDropdownJemaat({
        type,
        status,
      });
    }
  }, [fetchDropdownJemaat]);

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
    <Autocomplete
      placeholder={isLoadingDropdown ? "Loading" : name}
      data={selectJemaat}
      size="xs"
      radius="md"
      w={"100%"}
      rightSection={icon}
      label={name}
      value={value}
      onChange={(value) => {
        if (onChange) {
          onChange(value);
        }

        if (maxChar !== undefined) {
          const length = value ? value.length : 0;
          setRemaining(maxChar - length);
        }
      }}
      withAsterisk={require}
      // data-autofocus
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
