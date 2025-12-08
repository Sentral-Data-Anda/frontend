"use client";

import { CustomOption } from "@/types";
import { Combobox, InputBase, useCombobox } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";

interface PropTypes {
  value: string | null;
  onChange?: (_value: string | null) => void;
  onCreate: (label: string) => void;
  placeholder: string;
  data: CustomOption[];
  withLabel?: boolean;
  require?: boolean;
  disabled?: boolean;
  withinPortal?: boolean;
}

export const DropdownCreateComponent = ({
  value,
  onChange,
  onCreate,
  placeholder,
  data,
  withLabel = false,
  require = false,
  disabled = false,
  withinPortal = true,
}: PropTypes) => {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const [options, setOptions] = useState<CustomOption[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setOptions(data);
  }, [data]);

  const getLabelFromValue = (val: string | null) => {
    if (!val) return "";
    const found = options.find((opt) => opt.value === val);
    return found ? found.label : val;
  };

  useEffect(() => {
    setSearch(getLabelFromValue(value));
  }, [value, options]);

  const exactOptionMatch = options?.some(
    (opt) => opt.label.toLowerCase() === search.toLowerCase(),
  );

  const filteredOptions = exactOptionMatch
    ? options
    : options?.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase().trim()),
      );

  return (
    <Combobox
      store={combobox}
      withinPortal={withinPortal}
      onOptionSubmit={(val) => {
        if (val === "$create") {
          onCreate(search);
        } else {
          const selected = options?.find((opt) => opt.value === val);
          if (selected) {
            onChange?.(selected.value);
            setSearch(selected.label);
          }
        }
        combobox.closeDropdown();
      }}>
      <Combobox.Target>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            position: "relative",
          }}>
          {withLabel && (
            <label
              style={{
                fontSize: "12px",
                fontWeight: 500,
                display: "inline-block",
              }}>
              {placeholder}
              {require && <span style={{ color: "#fa5252" }}> *</span>}
            </label>
          )}

          <InputBase
            data-autofocus
            size="xs"
            radius="md"
            rightSection={<Combobox.Chevron />}
            value={search}
            onChange={(event) => {
              if (!disabled) {
                combobox.openDropdown();
                combobox.updateSelectedOptionIndex();
                setSearch(event.currentTarget.value);
              }
            }}
            onClick={() => !disabled && combobox.openDropdown()}
            onFocus={() => !disabled && combobox.openDropdown()}
            onBlur={() => {
              if (!disabled) {
                combobox.closeDropdown();
                setSearch(getLabelFromValue(value));
              }
            }}
            placeholder={placeholder}
            rightSectionPointerEvents="none"
            readOnly={disabled}
            styles={{
              input: {
                minHeight: 32,
                height: 32,
              },
            }}
          />

          {value && !disabled && (
            <IconX
              style={{
                height: "25%",
                position: "absolute",
                right: 20,
                bottom: 9,
                color: "#000000a1",
                cursor: "pointer",
              }}
              onClick={() => {
                onChange?.(null);
                setSearch("");
              }}
            />
          )}
        </div>
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>
          {filteredOptions?.length > 0 ? (
            filteredOptions?.map((opt) => (
              <Combobox.Option
                value={opt.value}
                key={opt.value}
                disabled={opt.disabled}
                styles={{
                  option: { fontSize: "12px" },
                }}>
                {opt.label}
              </Combobox.Option>
            ))
          ) : !exactOptionMatch && search.trim().length === 0 ? (
            <Combobox.Option
              value={"$create"}
              disabled
              styles={{
                option: { fontSize: "12px" },
              }}>
              Nothing found...
            </Combobox.Option>
          ) : null}

          {!exactOptionMatch && search.trim().length > 0 && (
            <Combobox.Option
              value="$create"
              styles={{
                option: { fontSize: "12px" },
              }}>
              Buat Pilihan Baru : {search}
            </Combobox.Option>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
};
