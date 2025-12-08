import {
  ComboboxData,
  FloatingPosition,
  PopoverWidth,
  Select,
} from "@mantine/core";

interface PropTypes {
  value: string | null;
  onChange?: (_value: string | null) => void;
  placeholder: string;
  data: ComboboxData;
  withLabel?: boolean;
  require?: boolean;
  disabled?: boolean;
  withinPortal?: boolean;
  position?: FloatingPosition;
  widthPopOver?: PopoverWidth;
  disableSearch?: boolean;
}

export const DropdownComponent = (props: PropTypes) => {
  const {
    value,
    onChange,
    placeholder,
    data,
    withLabel = false,
    require = false,
    disabled = false,
    disableSearch = false,
    withinPortal = true,
    position,
    widthPopOver,
  } = props;

  return (
    <Select
      data-autofocus
      w={"100%"}
      size="xs"
      radius="md"
      placeholder={placeholder}
      data={data}
      label={withLabel ? placeholder : ""}
      searchable={!disableSearch}
      nothingFoundMessage="Nothing found..."
      withAsterisk={require}
      value={value}
      onChange={onChange}
      readOnly={disabled}
      maxDropdownHeight={200}
      // disabled={disabled}
      clearable
      comboboxProps={{
        width: widthPopOver,
        position: position,
        withinPortal: withinPortal,
        keepMounted: false,
      }}
      styles={{
        input: {
          minHeight: 32,
          height: 32,
        },
      }}
    />
  );
};
