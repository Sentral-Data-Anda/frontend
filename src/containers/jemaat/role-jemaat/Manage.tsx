"use client";

import { useBoolean } from "@/hooks";
import { useHooksPagination } from "@/hooks/usePagination";
import { RoleJemaat } from "@/types";
import { confirmSwal } from "@/utils/alertSwal";
import { Flex, Stack, Text, useMantineTheme } from "@mantine/core";
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
import ModalCreate from "./ModalCreate";
import { formatYearRange } from "@/utils/general";
import ModalDetail from "./ModalDetail";
import { roleJemaatService } from "@/services";

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

  const isOpenModalDetail = useBoolean();

  const [dataRoleJemaat, setDataRoleJemaat] = useState<RoleJemaat[]>([]);

  const [hasMore, setHasMore] = useState<boolean>(true);

  const [pickYear, setPickYear] = useState<string | null>(null);

  const [pickRole, setPickRole] = useState<number>(0);

  async function handleGetAll() {
    isLoading.onTrue();

    try {
      const params = {
        page: activePage,
        limit: limitPage,
        filter: searchData,
        year: pickYear,
      };

      const response = await roleJemaatService.getAll(params);

      if (activePage === 1) {
        setDataRoleJemaat(response.data);
      } else {
        setDataRoleJemaat((prev) => [...prev, ...response.data]);
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
      setDataRoleJemaat([]);
      setTotalData(0);
      setTotalPage(0);
      setHasMore(false);
    } finally {
      isLoading.onFalse();
    }
  }

  useEffect(() => {
    setActivePage(1);
  }, [searchData, pickYear]);

  useEffect(() => {
    handleGetAll();
  }, [activePage, searchData, pickYear]);

  async function handleDelete(data: RoleJemaat) {
    isLoading.onTrue();

    try {
      const response = await roleJemaatService.delete(data.id);

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
        text: error || "Something went wrong",
      });
    } finally {
      isLoading.onFalse();
    }
  }

  const alertRemove = (data: RoleJemaat) => {
    confirmSwal({
      title: "Apakah Anda Yakin Menghapus?",
      labelConfirm: "Yes",
      onConfirm: () => {
        handleDelete(data);
      },
    });
  };

  const menuSettings = (data: RoleJemaat) => [
    {
      label: "",
      menu: [
        {
          name: "Detail",
          icon: <IconEye size={14} />,
          color: "blue",
          onClick: () => {
            isOpenModalDetail.onTrue();
            setPickRole(data.id);
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
          {
            type: "ButtonNew",
            onClick: () => {
              isOpenModalCreate.onTrue();
            },
          },
        ]}
        haveDropdown
        dropdowns={[{ type: "Tahun", pick: pickYear, setPick: setPickYear }]}
      />

      {dataRoleJemaat.length > 0 ? (
        <InfiniteScroll
          dataLength={dataRoleJemaat.length}
          next={() => {
            setTimeout(() => {
              setActivePage((prev) => prev + 1);
            }, 800);
          }}
          hasMore={hasMore}
          loader={
            <Flex justify={"center"}>
              <div className="loader-table"></div>
            </Flex>
          }>
          <Stack gap="xs">
            {dataRoleJemaat && dataRoleJemaat.length > 0
              ? dataRoleJemaat.map((data: RoleJemaat, index: number) => (
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
                          <Flex direction={"column"} w={"100%"} gap={5}>
                            <Text
                              size="sm"
                              fw={600}
                              style={{
                                textWrap: "nowrap",
                              }}>
                              {data.name ?? "Default Name"}
                            </Text>

                            <Flex align={"center"} justify={"space-between"}>
                              <Text
                                size="xs"
                                fw={400}
                                style={{
                                  textWrap: "nowrap",
                                  opacity: 0.5,
                                }}>
                                {data.jemaat.name ?? "Default Jemaat"}{" "}
                                <span
                                  style={{
                                    fontStyle: "italic",
                                  }}>
                                  (
                                  {formatYearRange(
                                    data.startPeriode,
                                    data.endPeriode,
                                  )}
                                  )
                                </span>
                              </Text>

                              <BadgeComponent
                                variant="light"
                                color={
                                  data.status
                                    ? theme.colors.success[9]
                                    : theme.colors.failed[5]
                                }
                                text={data.status ? "Aktif" : "Tidak Aktif"}
                                radius={"xs"}
                                size="xs"
                              />
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
      />

      <ModalDetail
        isOpenModal={isOpenModalDetail}
        idRole={pickRole}
        handleGetAll={handleGetAll}
      />
    </>
  );
};

export default Manage;
