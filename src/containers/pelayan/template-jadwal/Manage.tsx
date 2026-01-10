"use client";

import { useBoolean, useHooksPagination, useZustandStore } from "@/hooks";
import { Flex, Stack, Table, Text, useMantineTheme } from "@mantine/core";
import { IconEye, IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { customNotification } from "@/utils/notification";
import { templatePelayanService } from "@/services";
import { DropdownMenuComponent, EmptyData, FilterMenu } from "@/components";
import { confirmSwal, extractErrorMessage } from "@/utils";
import InfiniteScroll from "react-infinite-scroll-component";
import ModalCreate from "./ModalCreate";
import { DaftarTemplate } from "@/types";

import "dayjs/locale/id";
import "swiper/css";
import "swiper/css/scrollbar";
import ModalDetail from "./ModalDetail";

const Manage = () => {
  const theme = useMantineTheme();

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
    (item) => item.name === "Create Template Jadwal",
  );
  const haveAccessUpdate = detailUser?.roleUser?.access?.find(
    (item) => item.name === "Update Template Jadwal",
  );
  const haveAccessDelete = detailUser?.roleUser?.access?.find(
    (item) => item.name === "Delete Template Jadwal",
  );

  const isLoading = useBoolean();

  const isOpenModalCreate = useBoolean();

  const isOpenModalDetail = useBoolean();

  const [dataTemplate, setDataTemplate] = useState<DaftarTemplate[]>([]);

  const [hasMore, setHasMore] = useState<boolean>(true);

  const [pickBapel, setPickBapel] = useState<string | null>(null);

  const [pickTemplate, setPickTemplate] = useState<string>("");

  async function handleGetAll() {
    isLoading.onTrue();

    try {
      const params = {
        page: activePage,
        limit: limitPage,
        filter: searchData,
        bapelId: pickBapel,
      };

      const response = await templatePelayanService.getAll(params);

      if (activePage === 1) {
        setDataTemplate(response.data);
      } else {
        setDataTemplate((prev) => [...prev, ...response.data]);
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
      setDataTemplate([]);
      setTotalData(0);
      setTotalPage(0);
      setHasMore(false);
    } finally {
      isLoading.onFalse();
    }
  }

  useEffect(() => {
    setDataTemplate([]);
    setActivePage(1);
    setHasMore(true);
  }, [searchData, pickBapel]);

  useEffect(() => {
    if (activePage === 1) {
      handleGetAll();
    }
  }, [activePage, searchData, pickBapel]);

  useEffect(() => {
    if (activePage > 1) {
      handleGetAll();
    }
  }, [activePage]);

  async function handleDelete(data: DaftarTemplate) {
    isLoading.onTrue();

    try {
      const response = await templatePelayanService.delete(data.code);

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

  const alertRemove = (data: DaftarTemplate) => {
    confirmSwal({
      title: "Apakah Anda Yakin Menghapus?",
      labelConfirm: "Yes",
      onConfirm: () => {
        handleDelete(data);
      },
    });
  };

  const menuSettings = (data: DaftarTemplate) => [
    {
      label: "",
      menu: [
        {
          name: "Detail",
          color: "blue",
          icon: <IconEye size={14} />,
          onClick: () => {
            isOpenModalDetail.onTrue();
            setPickTemplate(data.code);
          },
        },
        {
          name: "Delete",
          color: "red",
          icon: <IconTrash size={14} />,
          onClick: () => {
            alertRemove(data);
          },
          disabled: !isAdmin && !haveAccessDelete,
        },
      ],
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
        dropdowns={[{ type: "Bapel", pick: pickBapel, setPick: setPickBapel }]}
      />

      {dataTemplate.length > 0 ? (
        <InfiniteScroll
          dataLength={dataTemplate.length}
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
            {dataTemplate && dataTemplate.length > 0 ? (
              dataTemplate.map((item: DaftarTemplate, index: number) => {
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
                                      {itemChild.roleName}
                                    </Text>
                                  </Table.Td>
                                  <Table.Td px={3} py={5} ta={"center"}>
                                    -
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
        codeTemplate={pickTemplate}
        isOpenModal={isOpenModalDetail}
        handleGetAll={handleGetAll}
        withEditButton={isAdmin || !!haveAccessUpdate}
      />
    </>
  );
};

export default Manage;
