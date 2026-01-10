"use client";

import { useBoolean } from "@/hooks";
import { useHooksPagination } from "@/hooks/usePagination";
import { Events } from "@/types";
import { customNotification } from "@/utils/notification";
import { confirmSwal } from "@/utils/alertSwal";
import { extractErrorMessage, formatDateRange } from "@/utils/general";
import { Flex, Group, SimpleGrid, Table, Text } from "@mantine/core";

import { IconEye, IconTrash } from "@tabler/icons-react";

import { useEffect, useState } from "react";

import InfiniteScroll from "react-infinite-scroll-component";
import { useZustandStore } from "@/hooks";
import ModalCreate from "./ModalCreate";
import ModalDetail from "./ModalDetail";
import {
  BadgeComponent,
  CardPhotoComponent,
  EmptyData,
  FilterMenu,
} from "@/components";
import { eventService } from "@/services";

const ManageEvents = () => {
  const {
    activePage,
    setActivePage,
    limitPage,
    setTotalPage,
    setTotalData,
    searchData,
    setSearchData,
  } = useHooksPagination();

  const { detailUser } = useZustandStore();

  const isAdmin = detailUser?.roleUser?.isAdmin;

  const haveAccessCreate = detailUser?.roleUser?.access?.find(
    (item) => item.name === "Create Event",
  );
  const haveAccessUpdate = detailUser?.roleUser?.access?.find(
    (item) => item.name === "Update Event",
  );
  const haveAccessDelete = detailUser?.roleUser?.access?.find(
    (item) => item.name === "Delete Event",
  );

  const isLoading = useBoolean();

  const isOpenModalCreate = useBoolean();

  const isOpenModalDetail = useBoolean();

  const [dataEvents, setDataEvents] = useState<Events[]>([]);

  const [hasMore, setHasMore] = useState<boolean>(true);

  const [pickBapel, setPickBapel] = useState<string | null>(null);

  const [pickRuangan, setPickRuangan] = useState<string | null>(null);

  const [pickEvents, setPickEvents] = useState<string>("");

  async function handleGetAll() {
    setHasMore(true);

    isLoading.onTrue();

    try {
      const params = {
        page: activePage,
        limit: limitPage,
        filter: searchData,
        bapelId: pickBapel,
        roomId: pickRuangan,
      };

      const response = await eventService.getAll(params);

      if (activePage === 1) {
        setDataEvents(response.data);
      } else {
        setDataEvents((prev) => [...prev, ...response.data]);
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
          text: error || "Something went wrong",
        });
      }
      setDataEvents([]);
      setTotalData(0);
      setTotalPage(0);
      setHasMore(false);
    } finally {
      isLoading.onFalse();
    }
  }

  useEffect(() => {
    setDataEvents([]);
    setActivePage(1);
    setHasMore(true);
  }, [searchData, pickBapel, pickRuangan]);

  useEffect(() => {
    if (activePage === 1) {
      handleGetAll();
    }
  }, [activePage, searchData, pickBapel, pickRuangan]);

  useEffect(() => {
    if (activePage > 1) {
      handleGetAll();
    }
  }, [activePage]);

  async function handleDelete(data: Events) {
    isLoading.onTrue();

    try {
      const response = await eventService.delete(data.code);

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

  const alertRemove = (data: Events) => {
    confirmSwal({
      title: "Apakah Yakin Menghapus Data ?",
      labelConfirm: "Yes",
      onConfirm: () => {
        handleDelete(data);
      },
    });
  };

  const buttonDetailCard = (data: Events) => [
    {
      label: "Detail",
      icon: <IconEye size={14} />,
      color: "blue",
      onClick: () => {
        isOpenModalDetail.onTrue();
        setPickEvents(data.code);
      },
    },
    {
      label: "Delete",
      icon: <IconTrash size={14} />,
      color: "red",
      onClick: () => {
        alertRemove(data);
      },
      disabled: !isAdmin && !haveAccessDelete,
    },
  ];

  return (
    <>
      <FilterMenu
        onSearch={setSearchData}
        buttons={
          isAdmin || haveAccessCreate
            ? [
                {
                  type: "ButtonNew",
                  onClick: () => {
                    isOpenModalCreate.onTrue();
                  },
                },
              ]
            : []
        }
        haveDropdown
        dropdowns={[
          { type: "Bapel", pick: pickBapel, setPick: setPickBapel },
          { type: "Room", pick: pickRuangan, setPick: setPickRuangan },
        ]}
      />

      {dataEvents.length > 0 ? (
        <InfiniteScroll
          dataLength={dataEvents.length}
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
          {dataEvents && dataEvents.length > 0 ? (
            <SimpleGrid cols={{ base: 1, xs: 2, md: 3, lg: 4 }} spacing={"sm"}>
              {dataEvents.map((value: Events, index: number) => {
                const title = (
                  <Flex direction={"column"} align={"start"} gap={5}>
                    <Group gap={2}>
                      <BadgeComponent
                        color={value.isPaid ? "yellow" : "green"}
                        size="xs"
                        radius="md"
                        text={value.isPaid ? "Paid" : "Free"}
                      />
                      <BadgeComponent
                        color={"blue"}
                        size="xs"
                        radius="md"
                        text={value.bapel.name}
                      />
                    </Group>
                    <Text size="sm" fw={500}>
                      {value.name}
                    </Text>
                  </Flex>
                );

                const description = (
                  <Table w={"100%"} withRowBorders={false} mt={"xs"}>
                    <Table.Tbody>
                      <Table.Tr>
                        <Table.Td ta={"start"} w={"1%"} p={0}>
                          <Text c="dimmed" size="xs" p={0}>
                            Tanggal
                          </Text>
                        </Table.Td>
                        <Table.Td ta={"center"} px={1.5} py={1}>
                          <Text c="dimmed" size="xs" p={0}>
                            :
                          </Text>
                        </Table.Td>
                        <Table.Td ta={"start"} p={0}>
                          <Text c="dimmed" size="xs">
                            {formatDateRange(value.startDate, value.endDate)}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td ta={"start"} w={"1%"} p={0}>
                          <Text c="dimmed" size="xs" p={0}>
                            Peserta
                          </Text>
                        </Table.Td>
                        <Table.Td ta={"center"} px={1.5} py={1}>
                          <Text c="dimmed" size="xs" p={0}>
                            :
                          </Text>
                        </Table.Td>
                        <Table.Td ta={"start"} p={0}>
                          <Text c="dimmed" size="xs">
                            {value.capacity}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td ta={"start"} w={"1%"} p={0}>
                          <Text c="dimmed" size="xs" p={0}>
                            Lokasi
                          </Text>
                        </Table.Td>
                        <Table.Td ta={"center"} px={1.5} py={1}>
                          <Text c="dimmed" size="xs" p={0}>
                            :
                          </Text>
                        </Table.Td>
                        <Table.Td ta={"start"} p={0}>
                          <Text c="dimmed" size="xs">
                            {value.isIndoor
                              ? `R. ${value.room.name}`
                              : value.location}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    </Table.Tbody>
                  </Table>
                );

                return (
                  <CardPhotoComponent
                    key={index}
                    title={title}
                    buttonDetail={true}
                    listButtonDetail={buttonDetailCard(value)}
                    mainImage={`${value.image.path}`}
                    description={description}
                  />
                );
              })}
            </SimpleGrid>
          ) : null}
        </InfiniteScroll>
      ) : isLoading.value && activePage === 1 ? (
        <Flex justify={"center"} mt={"28vh"}>
          <div className="loader-table"></div>
        </Flex>
      ) : (
        <EmptyData />
      )}

      <ModalCreate
        isOpenModal={isOpenModalCreate}
        handleGetAll={handleGetAll}
      />

      <ModalDetail
        codeEvent={pickEvents}
        isOpenModal={isOpenModalDetail}
        handleGetAll={handleGetAll}
        withEditButton={isAdmin || !!haveAccessUpdate}
      />
    </>
  );
};

export default ManageEvents;
