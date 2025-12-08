"use client";

import { useBoolean } from "@/hooks";
import { useHooksPagination } from "@/hooks/usePagination";
import { Access } from "@/types";
import { confirmSwal } from "@/utils/alertSwal";
import { customNotification } from "@/utils/notification";
import { ActionIcon, Table, Text } from "@mantine/core";

import { IconDotsVertical, IconEye, IconTrash } from "@tabler/icons-react";

import { Fragment, useEffect, useState } from "react";
import { accessService } from "@/services";
import {
  DropdownMenuComponent,
  FilterMenu,
  TableComponent,
} from "@/components";
import ModalCreate from "./ModalCreate";
import ModalDetail from "./ModalDetail";

const headerTable = [
  {
    name: "No",
  },
  {
    name: "Nama",
  },
  { name: "" },
];

const Manage = () => {
  const {
    activePage,
    setActivePage,
    totalPage,
    setTotalPage,
    totalData,
    setTotalData,
    searchData,
    setSearchData,
  } = useHooksPagination();

  const limitPage: number = 10;

  const isLoading = useBoolean();

  const isLoadingModal = useBoolean();

  const isOpenModalCreate = useBoolean();

  const isOpenModalDetail = useBoolean();

  const [dataAccess, setDataAccess] = useState<Access[]>([]);

  const [pickAccess, setPickAccess] = useState<number>(0);

  async function handleGetAll() {
    isLoading.onTrue();

    try {
      const params = {
        page: activePage,
        limit: limitPage,
        filter: searchData,
      };

      const response = await accessService.getAll(params);
      setDataAccess(response.data);
      setTotalData(response.totalData);
      setTotalPage(response.totalPage);
    } catch (error: any) {
      if (typeof error !== "string") {
        customNotification({
          type: "Error",
          text: error || "Something went wrong",
        });
      }
      setDataAccess([]);
      setTotalData(0);
      setTotalPage(0);
    } finally {
      isLoading.onFalse();
    }
  }

  useEffect(() => {
    setActivePage(1);
  }, [searchData]);

  useEffect(() => {
    handleGetAll();
  }, [activePage, searchData]);

  async function handleDeleteAccess(data: Access) {
    isLoadingModal.onTrue();

    try {
      const response = await accessService.delete(data.id);

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
      isLoadingModal.onFalse();
    }
  }

  const alertRemove = (data: Access) => {
    confirmSwal({
      title: "Apakah Yakin Menghapus Data ?",
      labelConfirm: "Yes",
      onConfirm: () => {
        handleDeleteAccess(data);
      },
    });
  };

  const menuSettings = (data: Access) => [
    {
      label: "",
      menu: [
        {
          name: "Detail",
          color: "blue",
          icon: <IconEye size={14} />,
          onClick: () => {
            isOpenModalDetail.onTrue();
            setPickAccess(data.id);
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
      />

      <TableComponent
        minWidth={0}
        loading={isLoading.value}
        typeHeader="basic"
        mainHeader={headerTable}
        activePage={activePage}
        totalData={totalData}
        totalPage={totalPage}
        limitData={limitPage}
        setActivePage={setActivePage}>
        {dataAccess && dataAccess.length > 0 ? (
          <Fragment>
            {dataAccess.map((data, index) => (
              <Table.Tr key={index}>
                <Table.Td ta={"center"} w={50}>
                  <Text size="xs">
                    {(activePage - 1) * limitPage + index + 1}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="xs">{data.name}</Text>
                </Table.Td>
                <Table.Td ta={"center"} w={50}>
                  <DropdownMenuComponent
                    button={
                      <ActionIcon
                        size={20}
                        variant="transparent"
                        aria-label="Detail">
                        <IconDotsVertical
                          style={{ width: "70%", height: "70%" }}
                          stroke={1.5}
                        />
                      </ActionIcon>
                    }
                    itemMenu={menuSettings(data)}
                    position="bottom-end"
                    width={170}
                  />
                </Table.Td>
              </Table.Tr>
            ))}
          </Fragment>
        ) : null}
      </TableComponent>

      <ModalCreate
        isOpenModal={isOpenModalCreate}
        handleGetAll={handleGetAll}
      />

      <ModalDetail
        idAccess={pickAccess}
        isOpenModal={isOpenModalDetail}
        handleGetAll={handleGetAll}
      />
    </>
  );
};

export default Manage;
