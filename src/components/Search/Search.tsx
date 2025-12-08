"use client";

import { TextInput, useMantineTheme } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import { useEffect, useState } from "react";

interface PropTypes {
  onChange: (_value: string) => void;
}

export const SearchComponent = (props: PropTypes) => {
  const { onChange } = props;
  const icon = <IconSearch size={16} />;
  const theme = useMantineTheme();

  const [search, setSearch] = useState<string>("");
  const [debouncedSearch] = useDebouncedValue(search, 500);

  useEffect(() => {
    if (onChange) {
      onChange(debouncedSearch);
    }
  }, [debouncedSearch, onChange]);

  return (
    <TextInput
      w={"100%"}
      radius="md"
      size="xs"
      leftSectionPointerEvents="none"
      leftSection={icon}
      placeholder="Search..."
      styles={{
        input: {
          outlineColor: theme.colors.default[9],
          minHeight: 32,
          height: 32,
        },
      }}
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  );
};
