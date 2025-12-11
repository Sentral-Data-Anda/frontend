"use client";

import { useBoolean } from "@/hooks";
import { useHooksPagination } from "@/hooks/usePagination";
import { NewUser, User } from "@/types";
import { confirmSwal } from "@/utils/alertSwal";
import {
  Avatar,
  Flex,
  Modal,
  Stack,
  Table,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { IconDotsVertical, IconEye, IconTrash } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import relativeTime from "dayjs/plugin/relativeTime";
import InfiniteScroll from "react-infinite-scroll-component";
import { customNotification } from "@/utils/notification";
import {
  BadgeComponent,
  DropdownMenuComponent,
  EmptyData,
  FilterMenu,
} from "@/components";
import { userService } from "@/services";
import ModalCreate from "./ModalCreate";
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

  const isLoading = useBoolean();

  const isOpenModalCreate = useBoolean();

  const isOpenModalNewUser = useBoolean();

  const isOpenModalDetail = useBoolean();

  const [dataUser, setDataUser] = useState<User[]>([]);

  const [newUser, setNewUser] = useState<NewUser | null>(null);

  const [hasMore, setHasMore] = useState<boolean>(true);

  const [pickStatus, setPickStatus] = useState<string | null>(null);

  const [pickRole, setPickRole] = useState<string | null>(null);

  const [pickUser, setPickUser] = useState<string>("");

  async function handleGetAll() {
    isLoading.onTrue();

    try {
      const params = {
        page: activePage,
        limit: limitPage,
        filter: searchData.includes("+62")
          ? searchData.replace("+62", "")
          : searchData,
        status: pickStatus,
        role: pickRole,
      };

      const response = await userService.getAll(params);

      if (activePage === 1) {
        setDataUser(response.data);
      } else {
        setDataUser((prev) => [...prev, ...response.data]);
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
      setDataUser([]);
      setTotalData(0);
      setTotalPage(0);
    } finally {
      isLoading.onFalse();
    }
  }

  useEffect(() => {
    setDataUser([]);
    setActivePage(1);
    setHasMore(true);
  }, [searchData, pickStatus, pickRole]);

  useEffect(() => {
    if (activePage === 1) {
      handleGetAll();
    }
  }, [activePage, searchData, pickStatus, pickRole]);

  useEffect(() => {
    if (activePage > 1) {
      handleGetAll();
    }
  }, [activePage]);

  async function handleDelete(data: User) {
    isLoading.onTrue();

    try {
      const response = await userService.delete(data.code);

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

  const alertRemove = (data: User) => {
    confirmSwal({
      title: "Apakah Anda Yakin ?",
      labelConfirm: "Yes",
      onConfirm: () => {
        handleDelete(data);
      },
    });
  };

  const menuSettings = (data: User) => [
    {
      label: "",
      menu: [
        {
          name: "Detail",
          color: "blue",
          icon: <IconEye size={14} />,
          onClick: () => {
            isOpenModalDetail.onTrue();
            setPickUser(data.code);
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
      <FilterMenu
        onSearch={setSearchData}
        buttons={[
          { type: "ButtonNew", onClick: () => isOpenModalCreate.onTrue() },
        ]}
        haveDropdown
        dropdowns={[
          { type: "RoleUser", pick: pickRole, setPick: setPickRole },
          { type: "StatusUser", pick: pickStatus, setPick: setPickStatus },
        ]}
      />

      {dataUser.length > 0 ? (
        <InfiniteScroll
          dataLength={dataUser.length}
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
            {dataUser && dataUser.length > 0
              ? dataUser.map((data: User, index: number) => (
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
                              key={data.jemaat.name}
                              name={data.jemaat.name}
                              color={"dark"}
                              size={35}
                            />

                            <Flex direction={"column"} w={"100%"} gap={5}>
                              <Flex align={"center"} justify={"space-between"}>
                                <Text
                                  size="sm"
                                  fw={600}
                                  style={{
                                    textWrap: "nowrap",
                                  }}>
                                  {data.jemaat.name ?? "Default User"}
                                </Text>
                              </Flex>

                              <Flex align={"center"} justify={"space-between"}>
                                <Text
                                  size="xs"
                                  fw={400}
                                  style={{
                                    textWrap: "nowrap",
                                    opacity: 0.5,
                                  }}>
                                  {data.roleUser.name ?? "Default Role"}
                                </Text>
                                <BadgeComponent
                                  variant="light"
                                  color={
                                    data.status === 1
                                      ? theme.colors.success[9]
                                      : data.status === -1
                                      ? theme.colors.failed[9]
                                      : theme.colors.warning[7]
                                  }
                                  text={
                                    data.status === 1
                                      ? "Active"
                                      : data.status === -1
                                      ? "Inactive"
                                      : "Pending"
                                  }
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
                ))
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
        handleNewUser={setNewUser}
        isOpenModalNewUser={isOpenModalNewUser}
      />

      <ModalDetail
        codeUser={pickUser}
        isOpenModal={isOpenModalDetail}
        handleGetAll={handleGetAll}
      />

      <Modal
        closeOnClickOutside={false}
        closeOnEscape={false}
        radius={"md"}
        opened={isOpenModalNewUser.value}
        onClose={isOpenModalNewUser.onFalse}
        title={newUser?.name}
        centered>
        <Table w={"100%"} withRowBorders={false}>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td ta={"end"} w={"40%"} px={2} py={5}>
                <Text size="xs">Username</Text>
              </Table.Td>
              <Table.Td ta={"center"} w={"10%"} px={2} py={5}>
                <Text size="xs">:</Text>
              </Table.Td>
              <Table.Td ta={"start"} w={"50%"} px={2} py={5}>
                <Text size="xs">{newUser?.username ?? "-"}</Text>
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Td ta={"end"} w={"40%"} px={2} py={5}>
                <Text size="xs">Password</Text>
              </Table.Td>
              <Table.Td ta={"center"} w={"10%"} px={2} py={5}>
                <Text size="xs">:</Text>
              </Table.Td>
              <Table.Td ta={"start"} w={"50%"} px={2} py={5}>
                <Text size="xs">{newUser?.password ?? "-"}</Text>
              </Table.Td>
            </Table.Tr>

            <Table.Tr>
              <Table.Td ta={"center"} px={2} pt={20} pb={2} colSpan={3}>
                <Text size="xs" c={"red"}>
                  Harap untuk Screenshot / Catat data ini !!
                </Text>
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Modal>
    </>
  );
};

export default Manage;
