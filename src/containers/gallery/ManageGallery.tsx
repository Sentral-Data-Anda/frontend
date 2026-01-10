"use client";

import { useBoolean } from "@/hooks";
import { useHooksPagination } from "@/hooks/usePagination";
import { Gallery } from "@/types";
import { confirmSwal } from "@/utils/alertSwal";
import { extractErrorMessage } from "@/utils/general";
import { Flex, SimpleGrid, Text } from "@mantine/core";

import { IconEye, IconTrash } from "@tabler/icons-react";

import { useEffect, useState } from "react";

import InfiniteScroll from "react-infinite-scroll-component";
import { customNotification } from "@/utils/notification";
import { useZustandStore } from "@/hooks";
import ModalCreate from "./ModalCreate";
import ModalDetail from "./ModalDetail";
import {
  BadgeComponent,
  CardPhotoComponent,
  EmptyData,
  FilterMenu,
} from "@/components";
import { galleryService } from "@/services";

const ManageGallery = () => {
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
    (item) => item.name === "Create Gallery",
  );
  const haveAccessUpdate = detailUser?.roleUser?.access?.find(
    (item) => item.name === "Update Gallery",
  );
  const haveAccessDelete = detailUser?.roleUser?.access?.find(
    (item) => item.name === "Delete Gallery",
  );

  const isLoading = useBoolean();

  const isLoadingModal = useBoolean();

  const isOpenModalCreate = useBoolean();

  const isOpenModalDetail = useBoolean();

  const [dataGallery, setDataGallery] = useState<Gallery[]>([]);

  const [hasMore, setHasMore] = useState<boolean>(true);

  const [pickBapel, setPickBapel] = useState<string | null>(null);

  const [pickGallery, setPickGallery] = useState<string>("");

  async function handleGetAll() {
    setHasMore(true);

    isLoading.onTrue();

    try {
      const params = {
        page: activePage,
        limit: limitPage,
        filter: searchData,
        bapelId: pickBapel,
      };

      const response = await galleryService.getAll(params);

      if (activePage === 1) {
        setDataGallery(response.data);
      } else {
        setDataGallery((prev) => [...prev, ...response.data]);
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
      setDataGallery([]);
      setTotalData(0);
      setTotalPage(0);
      setHasMore(false);
    } finally {
      isLoading.onFalse();
    }
  }

  useEffect(() => {
    setDataGallery([]);
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

  async function handleDelete(data: Gallery) {
    isLoadingModal.onTrue();

    try {
      const response = await galleryService.delete(data.code);

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
      isLoadingModal.onFalse();
    }
  }

  const alertRemove = (data: Gallery) => {
    confirmSwal({
      title: "Apakah Yakin Menghapus Data ?",
      labelConfirm: "Yes",
      onConfirm: () => {
        handleDelete(data);
      },
    });
  };

  const buttonDetailCard = (data: Gallery) => [
    {
      label: "Detail",
      icon: <IconEye size={14} />,
      color: "blue",
      onClick: () => {
        isOpenModalDetail.onTrue();
        setPickGallery(data.code);
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
        dropdowns={[{ type: "Bapel", pick: pickBapel, setPick: setPickBapel }]}
      />

      {dataGallery.length > 0 ? (
        <InfiniteScroll
          dataLength={dataGallery.length}
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
          {dataGallery && dataGallery.length > 0 ? (
            <SimpleGrid cols={{ base: 1, xs: 2, md: 3, lg: 4 }} spacing={"sm"}>
              {dataGallery.map((value: Gallery, index: number) => {
                const title = (
                  <Flex direction={"column"} align={"start"} gap={5}>
                    <Text size="sm" fw={500}>
                      {value.name}
                    </Text>
                    <BadgeComponent
                      color={"blue"}
                      size="sm"
                      radius="md"
                      text={value?.bapel?.name ?? "-"}
                    />
                  </Flex>
                );

                return (
                  <CardPhotoComponent
                    key={index}
                    title={title}
                    buttonDetail={true}
                    listButtonDetail={buttonDetailCard(value)}
                    mainImage={value.listImage[0].path}
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
        codeGallery={pickGallery}
        isOpenModal={isOpenModalDetail}
        handleGetAll={handleGetAll}
        withEditButton={isAdmin || !!haveAccessUpdate}
      />
    </>
  );
};

export default ManageGallery;
