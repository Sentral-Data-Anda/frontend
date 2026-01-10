"use client";

import { useBoolean } from "@/hooks/useBoolean";
import { useHooksPagination } from "@/hooks/usePagination";
import { Ruangan } from "@/types";
import { confirmSwal } from "@/utils/alertSwal";
import { extractErrorMessage } from "@/utils/general";
import { Flex, SimpleGrid, Text } from "@mantine/core";

import { IconEye, IconTrash } from "@tabler/icons-react";

import { useEffect, useState } from "react";

import InfiniteScroll from "react-infinite-scroll-component";
import { CardPhotoComponent, EmptyData, FilterMenu } from "@/components";
import ModalCreate from "./ModalCreate";
import ModalDetail from "./ModalDetail";
import { customNotification } from "@/utils";
import { ruanganService } from "@/services";
import { useZustandStore } from "@/hooks";

const Manage = () => {
  const { detailUser } = useZustandStore();

  const isAdmin = detailUser?.roleUser?.isAdmin;

  const haveAccessCreate = detailUser?.roleUser?.access?.find(
    (item) => item.name === "Create Room",
  );

  const haveAccessUpdate = detailUser?.roleUser?.access?.find(
    (item) => item.name === "Update Room",
  );

  const haveAccessDelete = detailUser?.roleUser?.access?.find(
    (item) => item.name === "Delete Room",
  );

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

  const [dataRuangan, setDataRuangan] = useState<Ruangan[]>([]);

  const [hasMore, setHasMore] = useState<boolean>(true);

  const [pickRuang, setPickRuang] = useState<string>("");

  async function handleGetAll() {
    setHasMore(true);

    isLoading.onTrue();

    try {
      const params = {
        page: activePage,
        limit: limitPage,
        filter: searchData,
      };

      const response = await ruanganService.getAll(params);

      if (activePage === 1) {
        setDataRuangan(response.data);
      } else {
        setDataRuangan((prev) => [...prev, ...response.data]);
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
      setDataRuangan([]);
      setTotalData(0);
      setTotalPage(0);
      setHasMore(false);
    } finally {
      isLoading.onFalse();
    }
  }

  useEffect(() => {
    setDataRuangan([]);
    setActivePage(1);
    setHasMore(true);
  }, [searchData]);

  useEffect(() => {
    if (activePage === 1) {
      handleGetAll();
    }
  }, [activePage, searchData]);

  useEffect(() => {
    if (activePage > 1) {
      handleGetAll();
    }
  }, [activePage]);

  async function handleDelete(data: Ruangan) {
    isLoading.onTrue();

    try {
      const response = await ruanganService.delete(data.code);

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

  const alertRemove = (data: Ruangan) => {
    confirmSwal({
      title: "Apakah Anda Yakin Menghapus Data ?",
      labelConfirm: "Yes",
      onConfirm: () => {
        handleDelete(data);
      },
    });
  };

  const buttonDetailCard = (data: Ruangan) => [
    {
      label: "Detail",
      icon: <IconEye size={14} />,
      color: "blue",
      onClick: () => {
        isOpenModalDetail.onTrue();
        setPickRuang(data.code);
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
      />

      {dataRuangan.length > 0 ? (
        <InfiniteScroll
          dataLength={dataRuangan.length}
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
          {dataRuangan && dataRuangan.length > 0 ? (
            <SimpleGrid cols={{ base: 1, xs: 2, md: 3, lg: 4 }} spacing={"sm"}>
              {dataRuangan.map((value: Ruangan, index: number) => {
                const title = (
                  <Flex direction={"column"}>
                    <Text size="sm" fw={500}>
                      {value.name}
                    </Text>
                    <Text c="dimmed" size="xs">
                      Kapasitas : {value.capacity} Orang
                    </Text>
                  </Flex>
                );

                return (
                  <CardPhotoComponent
                    key={index}
                    title={title}
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
        codeRuang={pickRuang}
        isOpenModal={isOpenModalDetail}
        handleGetAll={handleGetAll}
        withEditButton={isAdmin || !!haveAccessUpdate}
      />
    </>
  );
};

export default Manage;
