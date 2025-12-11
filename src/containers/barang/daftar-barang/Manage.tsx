"use client";

import { useBoolean } from "@/hooks";
import { useHooksPagination } from "@/hooks/usePagination";
import { confirmSwal } from "@/utils/alertSwal";
import { Flex, SimpleGrid, Table, Text } from "@mantine/core";

import { IconEye, IconTrash } from "@tabler/icons-react";

import { Fragment, useEffect, useState } from "react";

import InfiniteScroll from "react-infinite-scroll-component";
import { useZustandStore } from "@/hooks";
import ModalCreate from "./ModalCreate";
import ModalDetail from "./ModalDetail";
import { Barang } from "@/types";
import { customNotification, extractErrorMessage } from "@/utils";
import {
  BadgeComponent,
  CardPhotoComponent,
  EmptyData,
  FilterMenu,
} from "@/components";
import { barangService } from "@/services";

const Manage = () => {
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

  const accessCreate = detailUser?.roleUser?.access?.find(
    (item) => item.name === "Create Item",
  );
  const accessUpdate = detailUser?.roleUser?.access?.find(
    (item) => item.name === "Update Item",
  );
  const accessDelete = detailUser?.roleUser?.access?.find(
    (item) => item.name === "Delete Item",
  );

  const isLoading = useBoolean();

  const isOpenModalCreate = useBoolean();

  const isOpenModalDetail = useBoolean();

  const [dataBarang, setDataBarang] = useState<Barang[]>([]);

  const [hasMore, setHasMore] = useState<boolean>(true);

  const [pickType, setPickType] = useState<string | null>(null);

  const [pickBapel, setPickBapel] = useState<string | null>(null);

  const [pickBarang, setPickBarang] = useState<string>("");

  async function handleGetAll() {
    setHasMore(true);

    isLoading.onTrue();

    try {
      const params = {
        page: activePage,
        limit: limitPage,
        filter: searchData,
        bapelId: pickBapel,
        typeId: pickType,
      };

      const response = await barangService.getAll(params);

      if (activePage === 1) {
        setDataBarang(response.data);
      } else {
        setDataBarang((prev) => [...prev, ...response.data]);
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
      setDataBarang([]);
      setTotalData(0);
      setTotalPage(0);
      setHasMore(false);
    } finally {
      isLoading.onFalse();
    }
  }

  useEffect(() => {
    setDataBarang([]);
    setActivePage(1);
    setHasMore(true);
  }, [searchData, pickBapel, pickType]);

  useEffect(() => {
    if (activePage === 1) {
      handleGetAll();
    }
  }, [activePage, searchData, pickBapel, pickType]);

  useEffect(() => {
    if (activePage > 1) {
      handleGetAll();
    }
  }, [activePage]);

  async function handleDeleteItem(data: Barang) {
    isLoading.onTrue();

    try {
      const response = await barangService.delete(data.code);

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

  const alertRemove = (data: Barang) => {
    confirmSwal({
      title: "Apakah Yakin Menghapus Data ?",
      labelConfirm: "Yes",
      onConfirm: () => {
        handleDeleteItem(data);
      },
    });
  };

  const buttonDetailCard = (data: Barang) => [
    {
      label: "Detail",
      icon: <IconEye size={14} />,
      color: "blue",
      onClick: () => {
        isOpenModalDetail.onTrue();
        setPickBarang(data.code);
      },
      disabled: !isAdmin || !!accessUpdate,
    },
    {
      label: "Delete",
      icon: <IconTrash size={14} />,
      color: "red",
      onClick: () => {
        alertRemove(data);
      },
      disabled: !isAdmin || !!accessDelete,
    },
  ];

  return (
    <>
      <FilterMenu
        onSearch={setSearchData}
        buttons={
          isAdmin || accessCreate
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
          { type: "TypeItem", pick: pickType, setPick: setPickType },
          { type: "Bapel", pick: pickBapel, setPick: setPickBapel },
        ]}
      />

      {dataBarang.length > 0 ? (
        <InfiniteScroll
          dataLength={dataBarang.length}
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
          {dataBarang && dataBarang.length > 0 ? (
            <SimpleGrid cols={{ base: 1, xs: 2, md: 3, lg: 4 }} spacing={"sm"}>
              {dataBarang.map((value: Barang, index: number) => {
                const title = (
                  <Flex direction={"column"} align={"start"}>
                    <BadgeComponent
                      color={"blue"}
                      size="xs"
                      radius="md"
                      text={value.type.name}
                    />
                    <Text size="sm" fw={500}>
                      {value.name}
                    </Text>
                  </Flex>
                );

                const description = (
                  <Table w={"70%"} withRowBorders={false} mt={"xs"}>
                    <Table.Tbody>
                      <Table.Tr>
                        <Table.Td ta={"start"} w={"1%"} p={0}>
                          <Text c="dimmed" size="xs" p={0}>
                            Jumlah
                          </Text>
                        </Table.Td>
                        <Table.Td ta={"center"} px={1.5} py={1}>
                          <Text c="dimmed" size="xs" p={0}>
                            :
                          </Text>
                        </Table.Td>
                        <Table.Td ta={"start"} p={0}>
                          <Text c="dimmed" size="xs">
                            {value.quantity}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td ta={"start"} w={"1%"} p={0}>
                          <Text c="dimmed" size="xs" p={0}>
                            Bapel
                          </Text>
                        </Table.Td>
                        <Table.Td ta={"center"} px={1.5} py={1}>
                          <Text c="dimmed" size="xs" p={0}>
                            :
                          </Text>
                        </Table.Td>
                        <Table.Td ta={"start"} p={0}>
                          <Text c="dimmed" size="xs">
                            {value.bapel.name}
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
                            {value.room.name}
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
                    description={description}
                    buttonDetail={true}
                    listButtonDetail={buttonDetailCard(value)}
                    mainImage={`${value.mainImage.path}`}
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
        codeBarang={pickBarang}
        isOpenModal={isOpenModalDetail}
        handleGetAll={handleGetAll}
      />
    </>
  );
};

export default Manage;
