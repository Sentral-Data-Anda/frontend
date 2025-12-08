import { ComboboxData, MultiSelect } from "@mantine/core";

interface PropTypes {
  value: string[] | undefined;
  onChange?: (_value: string[] | undefined) => void;
  placeholder: string;
  data: ComboboxData;
  withLabel?: boolean;
  require?: boolean;
  disabled?: boolean;
  withinPortal?: boolean;
}

export const DropdownMultiComponent = (props: PropTypes) => {
  const {
    value,
    onChange,
    placeholder,
    data,
    withLabel = false,
    require = false,
    disabled = false,
    withinPortal = true,
  } = props;

  return (
    <MultiSelect
      data-autofocus
      width={"100%"}
      radius="md"
      size="xs"
      placeholder={placeholder}
      data={data}
      label={withLabel ? placeholder : ""}
      searchable
      nothingFoundMessage="Nothing found..."
      withAsterisk={require}
      value={value}
      onChange={onChange}
      readOnly={disabled}
      // disabled={disabled}
      clearable
      comboboxProps={{ withinPortal: withinPortal }}
      hidePickedOptions
      styles={{
        input: {
          minHeight: 32,
        },
      }}
    />
  );
};
