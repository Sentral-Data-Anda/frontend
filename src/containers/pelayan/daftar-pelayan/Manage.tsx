"use client";

import { useBoolean, useZustandStore } from "@/hooks";
import { useHooksPagination } from "@/hooks/usePagination";
import { DaftarPelayan } from "@/types";
import { confirmSwal } from "@/utils/alertSwal";
import {
  Avatar,
  Divider,
  Flex,
  Group,
  Stack,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { IconDotsVertical, IconEye, IconTrash } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import relativeTime from "dayjs/plugin/relativeTime";
import InfiniteScroll from "react-infinite-scroll-component";
import { customNotification } from "@/utils/notification";
import ModalCreate from "./ModalCreate";
import { pelayanService } from "@/services";
import {
  BadgeComponent,
  DropdownMenuComponent,
  EmptyData,
  FilterMenu,
} from "@/components";
import ModalDetail from "./ModalDetail";
import { extractErrorMessage } from "@/utils";

dayjs.extend(relativeTime);

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
    (item) => item.name === "Create Daftar Pelayan",
  );
  const haveAccessUpdate = detailUser?.roleUser?.access?.find(
    (item) => item.name === "Update Daftar Pelayan",
  );
  const haveAccessDelete = detailUser?.roleUser?.access?.find(
    (item) => item.name === "Delete Daftar Pelayan",
  );

  const isLoading = useBoolean();

  const isOpenModalCreate = useBoolean();

  const isOpenModalDetail = useBoolean();

  const [dataPelayan, setDataPelayan] = useState<DaftarPelayan[]>([]);

  const [hasMore, setHasMore] = useState<boolean>(true);

  const [pickRole, setPickRole] = useState<string | null>(null);

  const [pickBapel, setPickBapel] = useState<string | null>(null);

  const [pickPelayan, setPickPelayan] = useState<string>("");

  async function handleGetAll() {
    isLoading.onTrue();

    try {
      const params = {
        page: activePage,
        limit: limitPage,
        filter: searchData.includes("+62")
          ? searchData.replace("+62", "")
          : searchData,
        roleId: pickRole,
        bapelId: pickBapel,
      };

      const response = await pelayanService.getAll(params);

      if (activePage === 1) {
        setDataPelayan(response.data);
      } else {
        setDataPelayan((prev) => [...prev, ...response.data]);
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
      setDataPelayan([]);
      setTotalData(0);
      setTotalPage(0);
      setHasMore(false);
    } finally {
      isLoading.onFalse();
    }
  }

  useEffect(() => {
    setDataPelayan([]);
    setActivePage(1);
    setHasMore(true);
  }, [searchData, pickRole, pickBapel]);

  useEffect(() => {
    if (activePage === 1) {
      handleGetAll();
    }
  }, [activePage, searchData, pickRole, pickBapel]);

  useEffect(() => {
    if (activePage > 1) {
      handleGetAll();
    }
  }, [activePage]);

  async function handleDelete(data: DaftarPelayan) {
    isLoading.onTrue();

    try {
      const response = await pelayanService.delete(data.code);

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

  const alertRemove = (data: DaftarPelayan) => {
    confirmSwal({
      title: "Apakah Anda Yakin Menghapus?",
      labelConfirm: "Yes",
      onConfirm: () => {
        handleDelete(data);
      },
    });
  };

  const menuSettings = (data: DaftarPelayan) => [
    {
      label: "",
      menu: [
        {
          name: "Detail",
          color: "blue",
          icon: <IconEye size={14} />,
          onClick: () => {
            isOpenModalDetail.onTrue();
            setPickPelayan(data.code);
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
        dropdowns={[
          { type: "RolePelayan", pick: pickRole, setPick: setPickRole },
          { type: "Bapel", pick: pickBapel, setPick: setPickBapel },
        ]}
      />

      {dataPelayan.length > 0 ? (
        <InfiniteScroll
          dataLength={dataPelayan.length}
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
            {dataPelayan && dataPelayan.length > 0
              ? dataPelayan.map((data: DaftarPelayan, index: number) => {
                  const detailData =
                    data?.typePelayan === "INDIVIDUAL"
                      ? data.role
                      : data.members;

                  return (
                    <DropdownMenuComponent
                      key={index}
                      button={
                        <Flex
                          bg={"white"}
                          align={"center"}
                          style={{
                            cursor: "pointer",
                            borderRadius: 10,
                            boxShadow: "inset 0 0 0 1.5px #F3F4F6",
                          }}>
                          <Flex
                            flex={1}
                            p="xs"
                            bdrs={7}
                            justify={"space-between"}
                            direction={"column"}>
                            <Flex gap={10} align={"center"}>
                              <Avatar
                                key={data.namePelayan}
                                name={data.namePelayan}
                                color={
                                  data.genderPelayan === null
                                    ? "gray"
                                    : data.genderPelayan === "L"
                                    ? "blue"
                                    : "red"
                                }
                                size={35}
                              />

                              <Flex direction={"column"} w={"100%"} gap={5}>
                                <Text
                                  size="sm"
                                  fw={600}
                                  style={{
                                    textWrap: "nowrap",
                                  }}>
                                  {data.namePelayan ?? "Default Jemaat"}
                                </Text>

                                <Flex
                                  align={"center"}
                                  justify={"space-between"}>
                                  <Group gap={5} align="center">
                                    {detailData.length > 0 && (
                                      <>
                                        {detailData?.length === 1 && (
                                          <Text size="10px">
                                            {detailData[0] ?? ""}
                                          </Text>
                                        )}

                                        {detailData?.length === 2 && (
                                          <>
                                            <Text size="10px">
                                              {detailData[0] ?? ""}
                                            </Text>
                                            <Divider
                                              h={15}
                                              orientation="vertical"
                                            />
                                            <Text size="10px">
                                              {detailData[1] ?? ""}
                                            </Text>
                                          </>
                                        )}

                                        {detailData?.length > 2 && (
                                          <>
                                            <Text size="10px">
                                              {detailData[0] ?? ""}
                                            </Text>
                                            <Divider
                                              h={15}
                                              orientation="vertical"
                                            />
                                            <Text size="10px">
                                              {detailData[1] ?? ""}
                                            </Text>
                                            <Divider
                                              h={15}
                                              orientation="vertical"
                                            />
                                            <Avatar
                                              color="gray"
                                              variant="filled"
                                              radius="md"
                                              size="xs">
                                              +{detailData?.length - 2}
                                            </Avatar>
                                          </>
                                        )}
                                      </>
                                    )}
                                  </Group>

                                  <BadgeComponent
                                    variant="light"
                                    color={
                                      data.status
                                        ? theme.colors.success[9]
                                        : theme.colors.failed[9]
                                    }
                                    text={data.status ? "Active" : "Inactive"}
                                    radius={"xs"}
                                    size="xs"
                                  />
                                </Flex>
                              </Flex>
                            </Flex>
                          </Flex>

                          <Flex>
                            <IconDotsVertical
                              style={{ width: "70%", height: "70%" }}
                              stroke={1.5}
                            />
                          </Flex>
                        </Flex>
                      }
                      itemMenu={menuSettings(data)}
                      position="bottom-end"
                      width={170}
                    />
                  );
                })
              : null}
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
        codePelayan={pickPelayan}
        isOpenModal={isOpenModalDetail}
        handleGetAll={handleGetAll}
        withEditButton={isAdmin || !!haveAccessUpdate}
      />
    </>
  );
};

export default Manage;
