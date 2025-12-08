"use client";

import { useBoolean } from "@/hooks";
import { useHooksPagination } from "@/hooks/usePagination";
import { confirmSwal } from "@/utils/alertSwal";
import { ActionIcon, Table, Text } from "@mantine/core";

import { IconDotsVertical, IconEdit, IconTrash } from "@tabler/icons-react";

import { Fragment, useEffect, useState } from "react";
import { customNotification } from "@/utils/notification";
import ModalCreate from "./ModalCreate";
import ModalDetail from "./ModalDetail";
import {
  DropdownMenuComponent,
  FilterMenu,
  TableComponent,
} from "@/components";
import { TipeBarang } from "@/types";
import { tipeBarangService } from "@/services";
import { extractErrorMessage } from "@/utils";

const headerTable = [
  {
    name: "No",
    width: 50,
  },
  {
    name: "Nama",
  },
  { name: "", width: 50 },
];

const Manage = () => {
  const {
    activePage,
    setActivePage,
    limitPage,
    totalPage,
    setTotalPage,
    totalData,
    setTotalData,
    searchData,
    setSearchData,
  } = useHooksPagination();

  const isLoading = useBoolean();

  const isLoadingModal = useBoolean();

  const isOpenModalCreate = useBoolean();

  const isOpenModalDetail = useBoolean();

  const [dataTypeItem, setDataTypeItem] = useState<TipeBarang[]>([]);

  const [pickTipeBarang, setPickTipeBarang] = useState<string>("");

  async function handleGetAll() {
    isLoading.onTrue();

    try {
      const params = {
        page: activePage,
        limit: limitPage,
        filter: searchData,
      };

      const response = await tipeBarangService.getAll(params);
      setDataTypeItem(response.data);
      setTotalData(response.totalData);
      setTotalPage(response.totalPage);
    } catch (error: any) {
      if (typeof error !== "string") {
        customNotification({
          type: "Error",
          text: error || "Something went wrong",
        });
      }
      setDataTypeItem([]);
      setTotalData(0);
      setTotalPage(0);
    } finally {
      isLoading.onFalse();
    }
  }

  useEffect(() => {
    setDataTypeItem([]);
    setTotalData(0);
    setTotalPage(0);
    setActivePage(1);
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

  async function handleDelete(data: TipeBarang) {
    isLoadingModal.onTrue();

    try {
      const response = await tipeBarangService.delete(data.code);

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

  const alertRemove = (data: TipeBarang) => {
    confirmSwal({
      title: "Apakah Yakin Menghapus Data ?",
      labelConfirm: "Yes",
      onConfirm: () => {
        handleDelete(data);
      },
    });
  };

  const menuSettings = (data: TipeBarang) => [
    {
      label: "",
      menu: [
        {
          name: "Detail",
          color: "blue",
          icon: <IconEdit size={14} />,
          onClick: () => {
            isOpenModalDetail.onTrue();
            setPickTipeBarang(data.code);
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
        {dataTypeItem && dataTypeItem.length > 0 ? (
          <Fragment>
            {dataTypeItem.map((data, index) => (
              <Table.Tr key={index}>
                <Table.Td ta={"center"} w={50}>
                  <Text size="xs">
                    {(activePage - 1) * limitPage + index + 1}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text
                    size="xs"
                    style={{
                      textWrap: "nowrap",
                    }}>
                    {data.name}
                  </Text>
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
        codeTipeBarang={pickTipeBarang}
        isOpenModal={isOpenModalDetail}
        handleGetAll={handleGetAll}
      />
    </>
  );
};

export default Manage;
