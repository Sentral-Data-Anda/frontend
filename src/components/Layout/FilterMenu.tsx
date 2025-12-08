import {
  ActionIcon,
  Collapse,
  Flex,
  Grid,
  useMantineTheme,
} from "@mantine/core";
import { useBoolean } from "@/hooks";
import { IconFilter, IconPlus } from "@tabler/icons-react";
import {
  DropdownBapel,
  DropdownGender,
  DropdownRolePelayan,
  DropdownRoleUser,
  DropdownRoom,
  DropdownStatusJemaat,
  DropdownStatusUser,
  DropdownTypeItem,
} from "../Dropdown";
import { ButtonComponent } from "../Button";
import { SearchComponent } from "../Search";
import { DropdownYear } from "../Dropdown/WithData/DropdownYear";

type DropdownFilter<T extends string = string> = {
  type: T;
  pick: string | null | null;
  setPick: (_value: string | null) => void;
};

type ButtonFilter = { type: "ButtonNew"; onClick: () => void };

type FilterConfig =
  | ButtonFilter
  | DropdownFilter<
      | "Gender"
      | "RoleUser"
      | "RolePelayan"
      | "TypeItem"
      | "Room"
      | "Bapel"
      | "StatusJemaat"
      | "StatusUser"
      | "Tahun"
    >;

interface FilterMenuProps {
  onSearch: (val: string) => void;
  buttons?: ButtonFilter[];
  dropdowns?: Extract<
    FilterConfig,
    DropdownFilter<
      | "Gender"
      | "RoleUser"
      | "RolePelayan"
      | "TypeItem"
      | "Room"
      | "Bapel"
      | "StatusJemaat"
      | "StatusUser"
      | "Tahun"
    >
  >[];
  haveDropdown?: boolean;
}

export const FilterMenu = (props: FilterMenuProps) => {
  const {
    onSearch,
    buttons = [],
    dropdowns = [],
    haveDropdown = false,
  } = props;

  const theme = useMantineTheme();

  const isOpenCollapse = useBoolean();

  const colSpan = dropdowns.length > 0 ? Math.floor(12 / dropdowns.length) : 12;

  return (
    <Grid gutter={5} align="center">
      <Grid.Col span={12}>
        <Flex w={"100%"} align={"center"} gap={"xs"}>
          <SearchComponent onChange={onSearch} />

          {haveDropdown && (
            <Flex w={"fit-content"} justify="center">
              <ActionIcon
                size={32}
                radius="md"
                color={theme.colors.default[9]}
                variant={isOpenCollapse.value ? "filled" : "light"}
                aria-label="Filter"
                onClick={() => isOpenCollapse.setValue(!isOpenCollapse.value)}>
                <IconFilter
                  style={{ width: "70%", height: "70%" }}
                  stroke={1.5}
                />
              </ActionIcon>
            </Flex>
          )}
        </Flex>
      </Grid.Col>

      {/* {haveDropdown && (
        <Grid.Col span={1.5}>
          <Flex w="100%" justify="center">
            <ActionIcon
              size={32}
              radius="md"
              variant={isOpenCollapse.value ? "filled" : "light"}
              aria-label="Filter"
              onClick={() => isOpenCollapse.setValue(!isOpenCollapse.value)}>
              <IconFilter
                style={{ width: "70%", height: "70%" }}
                stroke={1.5}
              />
            </ActionIcon>
          </Flex>
        </Grid.Col>
      )} */}

      {haveDropdown && dropdowns.length > 0 && (
        <Collapse in={isOpenCollapse.value} w="100%" py={0} px={3}>
          <Grid w="100%" gutter={7} py={5}>
            {dropdowns.map((dropdown, index) => {
              switch (dropdown.type) {
                case "Gender":
                  return (
                    <Grid.Col span={colSpan} key={index}>
                      <DropdownGender
                        pick={dropdown.pick}
                        setPick={dropdown.setPick}
                      />
                    </Grid.Col>
                  );
                case "RoleUser":
                  return (
                    <Grid.Col span={colSpan} key={index}>
                      <DropdownRoleUser
                        pick={dropdown.pick}
                        setPick={dropdown.setPick}
                      />
                    </Grid.Col>
                  );
                case "RolePelayan":
                  return (
                    <Grid.Col span={colSpan} key={index}>
                      <DropdownRolePelayan
                        value={dropdown.pick}
                        onChange={dropdown.setPick}
                      />
                    </Grid.Col>
                  );
                case "TypeItem":
                  return (
                    <Grid.Col span={colSpan} key={index}>
                      <DropdownTypeItem
                        pick={dropdown.pick}
                        setPick={dropdown.setPick}
                      />
                    </Grid.Col>
                  );
                case "Room":
                  return (
                    <Grid.Col span={colSpan} key={index}>
                      <DropdownRoom
                        value={dropdown.pick}
                        onChange={dropdown.setPick}
                      />
                    </Grid.Col>
                  );
                case "Bapel":
                  return (
                    <Grid.Col span={colSpan} key={index}>
                      <DropdownBapel
                        value={dropdown.pick}
                        onChange={dropdown.setPick}
                      />
                    </Grid.Col>
                  );
                case "StatusJemaat":
                  return (
                    <Grid.Col span={colSpan} key={index}>
                      <DropdownStatusJemaat
                        pick={dropdown.pick}
                        setPick={dropdown.setPick}
                      />
                    </Grid.Col>
                  );
                case "StatusUser":
                  return (
                    <Grid.Col span={colSpan} key={index}>
                      <DropdownStatusUser
                        pick={dropdown.pick}
                        setPick={dropdown.setPick}
                      />
                    </Grid.Col>
                  );
                case "Tahun":
                  return (
                    <Grid.Col span={colSpan} key={index}>
                      <DropdownYear
                        pick={dropdown.pick}
                        setPick={dropdown.setPick}
                      />
                    </Grid.Col>
                  );
                default:
                  return null;
              }
            })}
          </Grid>
        </Collapse>
      )}

      {buttons.length > 0 && (
        <Grid.Col span={12}>
          <Flex gap="sm">
            {buttons.map((button: ButtonFilter, index) => {
              switch (button.type) {
                case "ButtonNew":
                  return (
                    <ButtonComponent
                      key={index}
                      name="New"
                      icon={<IconPlus size={15} stroke={1.5} />}
                      onClick={button.onClick}
                    />
                  );
                default:
                  return null;
              }
            })}
          </Flex>
        </Grid.Col>
      )}
    </Grid>
  );
};
