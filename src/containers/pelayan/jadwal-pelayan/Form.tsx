import {
  ButtonComponent,
  CheckInputComponent,
  DateInputComponent,
  DropdownBapel,
  DropdownComponent,
  DropdownRolePelayan,
  TextInputComponent,
} from "@/components";
import { useBoolean, useZustandStore } from "@/hooks";
import { dropdownListService, templatePelayanService } from "@/services";
import { DropdownPelayan, FormJadwalPelayan, TypeParams } from "@/types";
import { customNotification, extractErrorMessage, getTimeRange } from "@/utils";
import {
  ActionIcon,
  Flex,
  Grid,
  LoadingOverlay,
  Table,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { IconMinus, IconPlus } from "@tabler/icons-react";
import { ReactNode, useEffect, useState } from "react";

interface PropTypes {
  formJadwalPelayan: FormJadwalPelayan;
  setFormJadwalPelayan: (_value: FormJadwalPelayan) => void;
  isDisable: boolean;
  onSubmit: (_value: React.FormEvent<HTMLFormElement>) => void;
  button: ReactNode | null;
  isEditing?: boolean;
  isLoadingDetail?: ReturnType<typeof useBoolean>;
}

const Form = (props: PropTypes) => {
  const {
    formJadwalPelayan,
    setFormJadwalPelayan,
    isDisable,
    onSubmit,
    button,
    isEditing = false,
    isLoadingDetail,
  } = props;

  const theme = useMantineTheme();

  const isLoadingTemplate = useBoolean();

  const { selectTemplateJadwal, fetchDropdownTemplateJadwal } =
    useZustandStore();

  const [pickTemplate, setPickTemplate] = useState<string | null>(null);

  const times = getTimeRange("05:00", "22:00", 60);

  const [ddlPelayan, setDdlPelayan] = useState<DropdownPelayan[][]>([[]]);

  const optionsStart = times.map((time) => {
    return {
      value: time,
      label: time,
      disable: false,
    };
  });

  const optionsEnd = times.map((time) => {
    const selectedStart = formJadwalPelayan?.startTime ?? null;

    const beforeStart = selectedStart ? time <= selectedStart : false;

    return {
      value: time,
      label: time,
      disabled: Boolean(beforeStart),
    };
  });

  useEffect(() => {
    if (formJadwalPelayan.bapelId) {
      fetchDropdownTemplateJadwal({
        bapelId: formJadwalPelayan.bapelId,
      });
    }
  }, [formJadwalPelayan.bapelId]);

  const handleGetPelayan = async (index: number, params?: TypeParams) => {
    try {
      const response = await dropdownListService.getPelayan(params ?? {});

      if (response.status === 200) {
        const select = response?.data?.map((value: any) => ({
          label: value.name,
          value: value.code,
          jemaatId: value.jemaatId,
          disabled: value.disableServe,
        }));

        setDdlPelayan((prev) => {
          const updated = [...prev];
          updated[index] = select;
          return updated;
        });
      }
    } catch (error) {
      customNotification({
        type: typeof error === "string" ? "Warning" : "Error",
        text: extractErrorMessage(error),
      });
    }
  };

  const handleAddDetail = () => {
    setFormJadwalPelayan({
      ...formJadwalPelayan,
      detail: [
        ...formJadwalPelayan.detail,
        {
          order: formJadwalPelayan.detail.length + 1,
          rolePelayanId: null,
          isLoadingPelayan: false,
          pelayanId: null,
        },
      ],
    });

    setDdlPelayan((prev) => [...prev, []]);
  };

  const updateDetail = (
    index: number,
    key: "rolePelayanId" | "pelayanId",
    value: string | null,
  ) => {
    const updated = [...formJadwalPelayan.detail];
    updated[index] = { ...updated[index], [key]: value };

    if (key === "rolePelayanId") {
      updated[index] = {
        ...updated[index],
        isLoadingPelayan: value ? true : false,
        pelayanId: null,
      };

      if (value) {
        handleGetPelayan(index, {
          date: formJadwalPelayan.date,
          startTime: formJadwalPelayan.startTime,
          endTime: formJadwalPelayan.endTime,
          roleId: value,
          bapelId: formJadwalPelayan.bapelId,
        }).then(() => {
          updated[index] = {
            ...updated[index],
            isLoadingPelayan: false,
            pelayanId: null,
          };
        });
      }
    }

    setFormJadwalPelayan({
      ...formJadwalPelayan,
      detail: updated,
    });
  };

  const handleRemoveDetail = (index: number) => {
    const newList = formJadwalPelayan.detail.filter((_, i) => i !== index);
    setFormJadwalPelayan({
      ...formJadwalPelayan,
      detail: newList.map((d, i) => ({ ...d, order: i + 1 })),
    });

    setDdlPelayan((prev) => prev.filter((_, i) => i !== index));
  };

  async function handleGetDetail(codeTemplate: string) {
    isLoadingTemplate.onTrue();

    try {
      const response = await templatePelayanService.getOne(codeTemplate);

      setFormJadwalPelayan({
        ...formJadwalPelayan,
        name: response.data.name,
        startTime: response.data.startTime,
        endTime: response.data.endTime,
        detail: response.data.detail?.map((item: any) => {
          handleGetPelayan(item.order - 1, {
            date: formJadwalPelayan.date,
            startTime: response.data.startTime,
            endTime: response.data.endTime,
            roleId: String(item.rolePelayanId),
            bapelId: formJadwalPelayan.bapelId,
          });
          return {
            order: item.order,
            rolePelayanId: String(item.rolePelayanId),
            pelayanId: null,
          };
        }),
      });
    } catch (error: any) {
      customNotification({
        type: typeof error === "string" ? "Warning" : "Error",
        text: error || "Something went wrong",
      });
    } finally {
      isLoadingTemplate.onFalse();
    }
  }

  useEffect(() => {
    if (pickTemplate) {
      handleGetDetail(pickTemplate);
    }
  }, [pickTemplate]);

  async function fetchAllPelayan() {
    try {
      const promises = formJadwalPelayan.detail.map((item) =>
        handleGetPelayan(item.order - 1, {
          date: formJadwalPelayan.date,
          startTime: formJadwalPelayan.startTime,
          endTime: formJadwalPelayan.endTime,
          roleId: item.rolePelayanId,
          bapelId: formJadwalPelayan.bapelId,
        }),
      );

      await Promise.all(promises);
    } catch (error) {
      customNotification({
        type: typeof error === "string" ? "Warning" : "Error",
        text: error || "Something went wrong",
      });
      isLoadingDetail?.onFalse();
    }
  }

  useEffect(() => {
    if (
      isEditing &&
      formJadwalPelayan.date !== null &&
      formJadwalPelayan.detail.length > 0
    ) {
      fetchAllPelayan().then(() => {
        isLoadingDetail?.onFalse();
      });
    }
  }, [isEditing, formJadwalPelayan]);

  return (
    <>
      <LoadingOverlay
        visible={isLoadingTemplate.value}
        loaderProps={{
          children: (
            <Flex
              style={{
                height: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}>
              <div className="loader"></div>
            </Flex>
          ),
        }}
      />
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
              value={formJadwalPelayan?.bapelId}
              onChange={(value) => {
                setFormJadwalPelayan({
                  ...formJadwalPelayan,
                  bapelId: value ?? null,
                });
              }}
              withinPortal={false}
              withLabel
              require
              disabled={isDisable}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12 }}>
            <DateInputComponent
              label="Tanggal"
              value={formJadwalPelayan.date}
              onChange={(value) => {
                setFormJadwalPelayan({
                  ...formJadwalPelayan,
                  date: value,
                });
              }}
              disabled={isDisable}
              require
            />
          </Grid.Col>

          {!isEditing && selectTemplateJadwal.length > 0 ? (
            <Grid.Col span={{ base: 12 }}>
              <DropdownComponent
                placeholder={"Template Jadwal"}
                data={selectTemplateJadwal ?? []}
                value={pickTemplate}
                onChange={(value) => setPickTemplate(value)}
                withLabel
                withinPortal={false}
                disabled={selectTemplateJadwal.length === 0 || isDisable}
              />
            </Grid.Col>
          ) : null}

          {formJadwalPelayan.bapelId !== null &&
          formJadwalPelayan.date !== null ? (
            <>
              <Grid.Col span={{ base: 12 }}>
                <TextInputComponent
                  name="Name"
                  value={formJadwalPelayan.name}
                  onChange={(e) =>
                    setFormJadwalPelayan({
                      ...formJadwalPelayan,
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
                  value={formJadwalPelayan?.startTime}
                  onChange={(value) => {
                    setFormJadwalPelayan({
                      ...formJadwalPelayan,
                      startTime: value,
                      endTime: null,
                      detail: [
                        {
                          order: 1,
                          rolePelayanId: null,
                          isLoadingPelayan: false,
                          pelayanId: null,
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
                  value={formJadwalPelayan?.endTime}
                  onChange={(value) =>
                    setFormJadwalPelayan({
                      ...formJadwalPelayan,
                      endTime: value,
                      detail: [
                        {
                          order: 1,
                          rolePelayanId: null,
                          isLoadingPelayan: false,
                          pelayanId: null,
                        },
                      ],
                    })
                  }
                  withLabel
                  withinPortal={false}
                  require
                  disabled={formJadwalPelayan?.startTime === null || isDisable}
                  disableSearch
                />
              </Grid.Col>
            </>
          ) : null}

          {formJadwalPelayan.startTime !== null &&
          formJadwalPelayan.endTime !== null ? (
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
                    {formJadwalPelayan.detail &&
                    formJadwalPelayan.detail.length > 0
                      ? formJadwalPelayan.detail.map((item, index) => {
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
                                  data={
                                    ddlPelayan[index]?.map((opt) => {
                                      const selectedJemaatIds =
                                        formJadwalPelayan.detail
                                          .filter((_, idx) => idx !== index)
                                          .map((d) => {
                                            const selectedOption = ddlPelayan[
                                              index
                                            ]?.find(
                                              (item) =>
                                                item.value === d.pelayanId,
                                            );
                                            return selectedOption?.jemaatId;
                                          })
                                          .filter(Boolean);

                                      return {
                                        ...opt,
                                        disabled:
                                          opt.disabled ||
                                          selectedJemaatIds.includes(
                                            opt.jemaatId,
                                          ),
                                      };
                                    }) ?? []
                                  }
                                  value={item.pelayanId ?? null}
                                  onChange={(val) => {
                                    updateDetail(index, "pelayanId", val);
                                  }}
                                  placeholder={
                                    item.isLoadingPelayan
                                      ? "Loading..."
                                      : "Pelayan"
                                  }
                                  disabled={
                                    item.rolePelayanId === null || isDisable
                                  }
                                />
                              </Table.Td>
                              <Table.Td px={3} py={10} ta={"center"}>
                                <ActionIcon
                                  disabled={
                                    formJadwalPelayan.detail.length === 1 ||
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

              {!isEditing && pickTemplate === null ? (
                <Grid.Col span={{ base: 12 }}>
                  <CheckInputComponent
                    label="Make Template"
                    value={formJadwalPelayan?.makeTemplate}
                    onChange={(value) =>
                      setFormJadwalPelayan({
                        ...formJadwalPelayan,
                        makeTemplate: value,
                      })
                    }
                    disabled={isDisable}
                  />
                </Grid.Col>
              ) : null}
            </>
          ) : null}
        </Grid>

        {button}
      </form>
    </>
  );
};

export default Form;
