"use client";

import { useBoolean, useHooksPagination } from "@/hooks";
import { Flex, Grid, Stack, Table, Text, useMantineTheme } from "@mantine/core";
import { DatesProvider, MonthPickerInput } from "@mantine/dates";
import {
  IconCalendarWeek,
  IconEye,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { customNotification } from "@/utils/notification";
import { jadwalPelayanService } from "@/services";
import {
  ButtonComponent,
  DropdownMenuComponent,
  EmptyData,
} from "@/components";
import ModalCreate from "./ModalCreate";

import "dayjs/locale/id";
import "swiper/css";
import "swiper/css/scrollbar";
import { ListJadwalPelayan } from "@/types";
import { confirmSwal, extractErrorMessage } from "@/utils";
import InfiniteScroll from "react-infinite-scroll-component";
import ModalDetail from "./ModalDetail";

const Manage = () => {
  const theme = useMantineTheme();

  const today = dayjs();

  const isLoading = useBoolean();

  const isOpenModalCreate = useBoolean();

  const isOpenModalDetail = useBoolean();

  const { activePage, setActivePage, limitPage, setTotalPage, setTotalData } =
    useHooksPagination();

  const [pickMonth, setPickMonth] = useState<string | null>(
    today.format("YYYY-MM"),
  );

  const [pickJadwal, setPickJadwal] = useState<string>("");

  const [hasMore, setHasMore] = useState<boolean>(true);

  const [dataJadwal, setDataJadwal] = useState<ListJadwalPelayan[]>([]);

  async function handleGetAll() {
    isLoading.onTrue();

    try {
      const params = {
        page: activePage,
        limit: limitPage,
        month: pickMonth,
      };

      const response = await jadwalPelayanService.getAll(params);

      if (activePage === 1) {
        setDataJadwal(response.data);
      } else {
        setDataJadwal((prev) => [...prev, ...response.data]);
      }

      if (response.totalPage === activePage) {
        setHasMore(false);
      }

      setTotalData(response.totalData);
      setTotalPage(response.totalPage);
    } catch (error: any) {
      if (typeof error !== "string") {
        customNotification({
          type: "Error",
          text: extractErrorMessage(error),
        });
      }

      setDataJadwal([]);
      setTotalData(0);
      setTotalPage(0);
      setHasMore(false);
    } finally {
      isLoading.onFalse();
    }
  }

  useEffect(() => {
    setActivePage(1);
  }, [pickMonth]);

  useEffect(() => {
    if (pickMonth !== "" && pickMonth !== null) {
      handleGetAll();
    }
  }, [pickMonth]);

  async function handleDelete(data: ListJadwalPelayan) {
    isLoading.onTrue();

    try {
      const response = await jadwalPelayanService.delete(data.code);

      if (response && response.status === 200) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            handleGetAll();
          },
        );
      }
    } catch (error: any) {
      customNotification({
        type: typeof error === "string" ? "Warning" : "Error",
        text: extractErrorMessage(error),
      });
    } finally {
      isLoading.onFalse();
    }
  }

  const alertRemove = (data: ListJadwalPelayan) => {
    confirmSwal({
      title: "Apakah Anda Yakin Menghapus?",
      labelConfirm: "Yes",
      onConfirm: () => {
        handleDelete(data);
      },
    });
  };

  const menuSettings = (data: ListJadwalPelayan) => [
    {
      label: "",
      menu: [
        {
          name: "Detail",
          color: "blue",
          icon: <IconEye size={14} />,
          onClick: () => {
            isOpenModalDetail.onTrue();
            setPickJadwal(data.code);
          },
        },
        {
          name: "Delete",
          color: "red",
          icon: <IconTrash size={14} />,
          onClick: () => {
            alertRemove(data);
          },
        },
      ],
    },
  ];

  return (
    <>
      <Flex direction="column" gap="sm">
        <Grid gutter={"xs"}>
          <Grid.Col span={7}>
            <DatesProvider settings={{ locale: "id" }}>
              <MonthPickerInput
                size="xs"
                radius="md"
                value={pickMonth}
                onChange={(value) => {
                  setPickMonth(value);
                }}
                placeholder="Pilih Bulan"
                clearable
                valueFormat="MMMM YYYY"
                leftSection={<IconCalendarWeek size={18} stroke={1.5} />}
                styles={{
                  input: { minHeight: 32, height: 32 },
                }}
              />
            </DatesProvider>
          </Grid.Col>
          <Grid.Col span={5}>
            <ButtonComponent
              name={"New"}
              icon={<IconPlus size={15} stroke={1.5} />}
              onClick={() => {
                isOpenModalCreate.onTrue();
              }}
            />
          </Grid.Col>
        </Grid>

        <InfiniteScroll
          dataLength={dataJadwal.length}
          next={() => {
            setTimeout(() => {
              setActivePage((prev) => prev + 1);
            }, 800);
          }}
          hasMore={hasMore}
          loader={
            <Flex justify={"center"} mt={10}>
              <div className="loader-table"></div>
            </Flex>
          }>
          <Stack gap="xs">
            {dataJadwal && dataJadwal.length > 0 ? (
              dataJadwal.map((item: ListJadwalPelayan, index: number) => {
                return (
                  <DropdownMenuComponent
                    key={index}
                    button={
                      <Table key={index} withTableBorder withColumnBorders>
                        <Table.Thead bg={theme.colors.default[9]}>
                          <Table.Tr>
                            <Table.Th px={3} py={5} colSpan={2}>
                              <Text c="white" size="xs" ta={"center"}>
                                {item.name}
                              </Text>
                            </Table.Th>
                          </Table.Tr>
                          <Table.Tr>
                            <Table.Th px={3} py={5} colSpan={2}>
                              <Text c="white" size="xs" ta={"center"}>
                                {dayjs(item.date).format("DD MMMM YYYY")}{" "}
                                {`( ${item.startTime} - ${item.endTime} )`}
                              </Text>
                            </Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {item.detail && item.detail.length > 0 ? (
                            item.detail.map((itemChild, indexChild) => {
                              return (
                                <Table.Tr key={indexChild}>
                                  <Table.Td
                                    px={3}
                                    py={5}
                                    ta={"start"}
                                    w={100}
                                    bg={theme.colors.primary[1]}>
                                    <Text c="black" size="xs">
                                      {itemChild.role}
                                    </Text>
                                  </Table.Td>
                                  <Table.Td px={3} py={5} ta={"start"}>
                                    <Text c="black" size="xs">
                                      {itemChild.pelayan}
                                    </Text>
                                  </Table.Td>
                                </Table.Tr>
                              );
                            })
                          ) : (
                            <EmptyData />
                          )}
                        </Table.Tbody>
                      </Table>
                    }
                    itemMenu={menuSettings(item)}
                    position="bottom-end"
                    width={170}
                  />
                );
              })
            ) : (
              <EmptyData />
            )}
          </Stack>
        </InfiniteScroll>
      </Flex>

      <ModalCreate
        isOpenModal={isOpenModalCreate}
        handleGetAll={handleGetAll}
      />

      <ModalDetail
        codeJadwal={pickJadwal}
        isOpenModal={isOpenModalDetail}
        handleGetAll={handleGetAll}
      />
    </>
  );
};

export default Manage;
