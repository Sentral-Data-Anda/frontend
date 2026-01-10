"use client";

import {
  DropdownMenuComponent,
  FilterMenu,
  TableComponent,
} from "@/components";
import { ActionIcon, Flex, Table, Text } from "@mantine/core";
import { Fragment, useEffect, useState } from "react";
import { IconDotsVertical, IconEye, IconTrash } from "@tabler/icons-react";

import { useBoolean, useHooksPagination, useZustandStore } from "@/hooks";

import { confirmSwal } from "@/utils/alertSwal";

import { Bapel } from "@/types";
import { customNotification } from "@/utils/notification";
import ModalCreate from "./ModalCreate";
import ModalDetail from "./ModalDetail";
import { bapelService } from "@/services";

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

const ManageBapel = () => {
  const {
    limitPage,
    activePage,
    setActivePage,
    totalPage,
    setTotalPage,
    totalData,
    setTotalData,
    searchData,
    setSearchData,
  } = useHooksPagination();

  const { detailUser } = useZustandStore();

  const isAdmin = detailUser?.roleUser?.isAdmin;

  const haveAccessCreate = detailUser?.roleUser?.access?.find(
    (item) => item.name === "Create Bapel",
  );
  const haveAccessUpdate = detailUser?.roleUser?.access?.find(
    (item) => item.name === "Update Bapel",
  );
  const haveAccessDelete = detailUser?.roleUser?.access?.find(
    (item) => item.name === "Delete Bapel",
  );

  const isLoading = useBoolean();

  const isOpenModalCreate = useBoolean();

  const isOpenModalDetail = useBoolean();

  const [dataBapel, setDataBapel] = useState<Bapel[]>([]);

  const [pickBapel, setPickBapel] = useState<string>("");

  async function handleGetAll() {
    isLoading.onTrue();

    try {
      const params = {
        page: activePage,
        limit: limitPage,
        filter: searchData,
      };

      const response = await bapelService.getAll(params);
      setDataBapel(response.data);
      setTotalData(response.totalData);
      setTotalPage(response.totalPage);
    } catch (error: any) {
      if (typeof error !== "string") {
        customNotification({
          type: "Error",
          text: error || "Something went wrong",
        });
      }
      setDataBapel([]);
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
  }, [activePage]);

  async function handleDelete(data: Bapel) {
    isLoading.onTrue();

    try {
      const response = await bapelService.delete(data.code);

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

  const alertRemove = (data: Bapel) => {
    confirmSwal({
      title: "Apakah Yakin Menghapus Data ?",
      labelConfirm: "Yes",
      onConfirm: () => {
        handleDelete(data);
      },
    });
  };

  const menuSettings = (data: Bapel) => [
    {
      label: "",
      menu: [
        {
          name: "Detail",
          color: "blue",
          icon: <IconEye size={14} />,
          onClick: () => {
            isOpenModalDetail.onTrue();
            setPickBapel(data.code);
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
        {dataBapel && dataBapel.length > 0 ? (
          <Fragment>
            {dataBapel.map((data, index) => (
              <Table.Tr key={index}>
                <Table.Td ta={"center"} w={50}>
                  <Text size="xs">
                    {(activePage - 1) * limitPage + index + 1}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Flex direction={"column"} ta={"start"} gap={3}>
                    <Text
                      size="xs"
                      fw={600}
                      style={{
                        textWrap: "nowrap",
                      }}>
                      {data.name}
                    </Text>
                    <Text
                      size="xs"
                      fw={400}
                      style={{
                        textWrap: "nowrap",
                        opacity: 0.5,
                      }}>
                      {data.code}
                    </Text>
                  </Flex>
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
        codeBapel={pickBapel}
        isOpenModal={isOpenModalDetail}
        handleGetAll={handleGetAll}
        withEditButton={isAdmin || !!haveAccessUpdate}
      />
    </>
  );
};

export default ManageBapel;
