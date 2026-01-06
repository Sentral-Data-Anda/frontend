"use client";

import { useBoolean } from "@/hooks";
import { useHooksPagination } from "@/hooks/usePagination";
import { DaftarJemaat } from "@/types";
import { confirmSwal } from "@/utils/alertSwal";
import { Avatar, Flex, Stack, Text, useMantineTheme } from "@mantine/core";
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
import ModalDetail from "./ModalDetail";
import { jemaatService } from "@/services";
import { extractErrorMessage } from "@/utils";
import ModalChooseType from "./ModalChooseType";

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

  const isOpenModalType = useBoolean();

  const isOpenModalCreate = useBoolean();

  const isOpenModalDetail = useBoolean();

  const [dataJemaat, setDataJemaat] = useState<DaftarJemaat[]>([]);

  const [hasMore, setHasMore] = useState<boolean>(true);

  const [pickGender, setPickGender] = useState<string | null>(null);

  const [pickType, setPickType] = useState<string | null>("ANGGOTA");

  const [pickStatus, setPickStatus] = useState<string | null>("AKTIF");

  const [pickJemaat, setPickJemaat] = useState<string>("");

  const [chooseForm, setChooseForm] = useState<string>("");

  console.log("CHOOSE", chooseForm);

  async function handleGetAll() {
    isLoading.onTrue();

    try {
      const params = {
        page: activePage,
        limit: limitPage,
        filter: searchData.includes("+62")
          ? searchData.replace("+62", "")
          : searchData,
        gender: pickGender,
        status: pickStatus,
        type: pickType,
      };

      const response = await jemaatService.getAll(params);

      if (activePage === 1) {
        setDataJemaat(response.data);
      } else {
        setDataJemaat((prev) => [...prev, ...response.data]);
      }

      if (response.totalPage === activePage) {
        setHasMore(false);
      }

      setTotalData(response.totalData);
      setTotalPage(response.totalPage);
    } catch (error: any) {
      customNotification({
        type: typeof error === "string" ? "Warning" : "Error",
        text: extractErrorMessage(error),
      });
      setDataJemaat([]);
      setTotalData(0);
      setTotalPage(0);
      setHasMore(false);
    } finally {
      isLoading.onFalse();
    }
  }

  useEffect(() => {
    setDataJemaat([]);
    setActivePage(1);
    setHasMore(true);
  }, [searchData, pickGender, pickStatus, pickType]);

  useEffect(() => {
    if (activePage === 1) {
      handleGetAll();
    }
  }, [activePage, searchData, pickGender, pickStatus, pickType]);

  useEffect(() => {
    if (activePage > 1) {
      handleGetAll();
    }
  }, [activePage]);

  async function handleDelete(data: DaftarJemaat) {
    isLoading.onTrue();

    try {
      const response = await jemaatService.delete(data.code);

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
      }).then(() => {
        isLoading.onFalse();
      });
    }
  }

  const alertRemove = (data: DaftarJemaat) => {
    confirmSwal({
      title: "Apakah Anda Yakin Menghapus?",
      labelConfirm: "Yes",
      onConfirm: () => {
        handleDelete(data);
      },
    });
  };

  const menuSettings = (data: DaftarJemaat) => [
    {
      label: "",
      menu: [
        {
          name: "Detail",
          icon: <IconEye size={14} />,
          color: "blue",
          onClick: () => {
            isOpenModalDetail.onTrue();
            setPickJemaat(data.code);
            setChooseForm(data.type);
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
              isOpenModalType.onTrue();
            },
          },
        ]}
        haveDropdown
        dropdowns={[
          { type: "Gender", pick: pickGender, setPick: setPickGender },
          { type: "TypeJemaat", pick: pickType, setPick: setPickType },
          { type: "StatusJemaat", pick: pickStatus, setPick: setPickStatus },
        ]}
      />

      {dataJemaat.length > 0 ? (
        <InfiniteScroll
          dataLength={dataJemaat.length}
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
            {dataJemaat && dataJemaat.length > 0
              ? dataJemaat.map((data: DaftarJemaat, index: number) => (
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
                              key={data.name}
                              name={data.name}
                              color={data.gender === "L" ? "blue" : "red"}
                              allowedInitialsColors={["blue", "red"]}
                              size={35}
                            />

                            <Flex direction={"column"} w={"100%"} gap={5}>
                              <Text
                                size="sm"
                                fw={600}
                                style={{
                                  textWrap: "nowrap",
                                }}>
                                {data.name ?? "Default Jemaat"}
                              </Text>

                              <Flex align={"center"} justify={"space-between"}>
                                <Text
                                  size="xs"
                                  fw={400}
                                  style={{
                                    textWrap: "nowrap",
                                    opacity: 0.5,
                                  }}>
                                  {data.birthDate ?? "-"}
                                </Text>

                                <BadgeComponent
                                  variant="light"
                                  color={
                                    data.status === "AKTIF"
                                      ? theme.colors.success[9]
                                      : theme.colors.failed[9]
                                  }
                                  text={
                                    data.status === "AKTIF"
                                      ? "Aktif"
                                      : "Tidak Aktif"
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

      <ModalChooseType
        isOpenModal={isOpenModalType}
        handleSelect={(value) => {
          setChooseForm(value);
          isOpenModalType.onFalse();
          isOpenModalCreate.onTrue();
        }}
      />

      <ModalCreate
        formName={chooseForm}
        isOpenModal={isOpenModalCreate}
        handleGetAll={handleGetAll}
      />

      <ModalDetail
        formName={chooseForm}
        codeJemaat={pickJemaat}
        isOpenModal={isOpenModalDetail}
        handleGetAll={handleGetAll}
      />
    </>
  );
};

export default Manage;
