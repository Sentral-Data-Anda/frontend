import {
  ButtonComponent,
  DropdownBapel,
  DropdownComponent,
  DropdownRolePelayan,
  TextInputComponent,
} from "@/components";
import { FormTemplate } from "@/types";
import { getTimeRange } from "@/utils";
import { ActionIcon, Grid, Table, Text, useMantineTheme } from "@mantine/core";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import { ReactNode } from "react";

interface PropTypes {
  formTemplate: FormTemplate;
  setFormTemplate: (_value: FormTemplate) => void;
  isDisable: boolean;
  onSubmit: (_value: React.FormEvent<HTMLFormElement>) => void;
  button: ReactNode | null;
}

const Form = (props: PropTypes) => {
  const { formTemplate, setFormTemplate, isDisable, onSubmit, button } = props;

  const theme = useMantineTheme();

  const times = getTimeRange("05:00", "22:00", 60);

  const optionsStart = times.map((time) => {
    return {
      value: time,
      label: time,
      disable: false,
    };
  });

  const optionsEnd = times.map((time) => {
    const selectedStart = formTemplate?.startTime ?? null;

    const beforeStart = selectedStart ? time <= selectedStart : false;

    return {
      value: time,
      label: time,
      disabled: Boolean(beforeStart),
    };
  });

  const handleAddDetail = () => {
    setFormTemplate({
      ...formTemplate,
      detail: [
        ...formTemplate.detail,
        {
          order: formTemplate.detail.length + 1,
          rolePelayanId: null,
        },
      ],
    });
  };

  const updateDetail = (
    index: number,
    key: "rolePelayanId",
    value: string | null,
  ) => {
    const updated = [...formTemplate.detail];
    updated[index] = { ...updated[index], [key]: value };

    setFormTemplate({
      ...formTemplate,
      detail: updated,
    });
  };

  const handleRemoveDetail = (index: number) => {
    const newList = formTemplate.detail.filter((_, i) => i !== index);
    setFormTemplate({
      ...formTemplate,
      detail: newList.map((d, i) => ({ ...d, order: i + 1 })),
    });
  };

  return (
    <>
      <form
        onSubmit={onSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          minHeight: "100%",
          height: "100%",
        }}>
        <Grid w={"100%"} gutter={"xs"}>
          <Grid.Col span={{ base: 12 }}>
            <DropdownBapel
              value={formTemplate?.bapelId}
              onChange={(value) => {
                setFormTemplate({
                  ...formTemplate,
                  bapelId: value ?? null,
                });
              }}
              withinPortal={false}
              withLabel
              require
              disabled={isDisable}
            />
          </Grid.Col>

          {formTemplate.bapelId !== null ? (
            <>
              <Grid.Col span={{ base: 12 }}>
                <TextInputComponent
                  name="Name"
                  value={formTemplate.name}
                  onChange={(e) =>
                    setFormTemplate({
                      ...formTemplate,
                      name: e.target.value,
                    })
                  }
                  require
                  description={true}
                  maxChar={100}
                  disabled={isDisable}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 6 }}>
                <DropdownComponent
                  placeholder={"Dari Waktu"}
                  data={optionsStart ?? []}
                  value={formTemplate?.startTime}
                  onChange={(value) => {
                    setFormTemplate({
                      ...formTemplate,
                      startTime: value,
                      endTime: null,
                      detail: [
                        {
                          order: 1,
                          rolePelayanId: null,
                        },
                      ],
                    });
                  }}
                  withLabel
                  withinPortal={false}
                  require
                  disabled={isDisable}
                  disableSearch
                />
              </Grid.Col>
              <Grid.Col span={{ base: 6 }}>
                <DropdownComponent
                  placeholder={"Sampai Waktu"}
                  data={optionsEnd ?? []}
                  value={formTemplate?.endTime}
                  onChange={(value) =>
                    setFormTemplate({
                      ...formTemplate,
                      endTime: value,
                      detail: [
                        {
                          order: 1,
                          rolePelayanId: null,
                        },
                      ],
                    })
                  }
                  withLabel
                  withinPortal={false}
                  require
                  disabled={formTemplate?.startTime === null || isDisable}
                  disableSearch
                />
              </Grid.Col>
            </>
          ) : null}

          {formTemplate.startTime !== null && formTemplate.endTime !== null ? (
            <>
              <Grid.Col span={{ base: 12 }} mt={10}>
                <Table withTableBorder withColumnBorders>
                  <Table.Thead bg={theme.colors.default[1]}>
                    <Table.Tr>
                      <Table.Th px={3} py={5}>
                        <Text c="black" size="xs" ta={"center"} p={2}>
                          Role Pelayan
                        </Text>
                      </Table.Th>
                      <Table.Th px={3} py={5}>
                        <Text c="black" size="xs" ta={"center"} p={2}>
                          Nama Pelayan
                        </Text>
                      </Table.Th>
                      <Table.Th px={3} py={5}>
                        <Text c="black" size="xs" ta={"center"} p={2}>
                          Hapus
                        </Text>
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {formTemplate.detail && formTemplate.detail.length > 0
                      ? formTemplate.detail.map((item, index) => {
                          return (
                            <Table.Tr key={index}>
                              <Table.Td px={3} py={10}>
                                <DropdownRolePelayan
                                  value={item.rolePelayanId}
                                  onChange={(val) => {
                                    updateDetail(index, "rolePelayanId", val);
                                  }}
                                />
                              </Table.Td>
                              <Table.Td px={3} py={10}>
                                <DropdownComponent
                                  data={[]}
                                  value={null}
                                  onChange={() => {}}
                                  placeholder={"Pelayan"}
                                  disabled={true}
                                />
                              </Table.Td>
                              <Table.Td px={3} py={10} ta={"center"}>
                                <ActionIcon
                                  disabled={
                                    formTemplate.detail.length === 1 ||
                                    isDisable
                                  }
                                  size={28}
                                  variant="light"
                                  color="red"
                                  aria-label="Erase Detail"
                                  onClick={() => handleRemoveDetail(index)}>
                                  <IconMinus
                                    style={{ width: "60%", height: "60%" }}
                                    stroke={1.5}
                                  />
                                </ActionIcon>
                              </Table.Td>
                            </Table.Tr>
                          );
                        })
                      : null}

                    {!isDisable ? (
                      <Table.Tr>
                        <Table.Td p={0} colSpan={3}>
                          <ButtonComponent
                            radius="sm"
                            variant="subtle"
                            name="Pelayan"
                            icon={<IconPlus size={15} stroke={1.5} />}
                            onClick={handleAddDetail}
                          />
                        </Table.Td>
                      </Table.Tr>
                    ) : null}
                  </Table.Tbody>
                </Table>
              </Grid.Col>
            </>
          ) : null}
        </Grid>

        {button}
      </form>
    </>
  );
};

export default Form;
