"use client";

import { useBoolean, useZustandStore } from "@/hooks";
import { useHooksPagination } from "@/hooks/usePagination";
import { RolePelayan } from "@/types";
import { confirmSwal } from "@/utils/alertSwal";
import { customNotification } from "@/utils/notification";
import { ActionIcon, Table, Text } from "@mantine/core";

import { IconDotsVertical, IconEye, IconTrash } from "@tabler/icons-react";

import { Fragment, useEffect, useState } from "react";
import ModalCreate from "./ModalCreate";
import ModalDetail from "./ModalDetail";
import { extractErrorMessage } from "@/utils";
import { rolePelayanService } from "@/services";
import {
  DropdownMenuComponent,
  FilterMenu,
  TableComponent,
} from "@/components";

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
    (item) => item.name === "Create Role Pelayan",
  );
  const haveAccessUpdate = detailUser?.roleUser?.access?.find(
    (item) => item.name === "Update Role Pelayan",
  );
  const haveAccessDelete = detailUser?.roleUser?.access?.find(
    (item) => item.name === "Delete Role Pelayan",
  );

  const limitPage: number = 10;

  const isLoading = useBoolean();

  const isOpenModalCreate = useBoolean();

  const isOpenModalDetail = useBoolean();

  const [dataRolePelayan, setDataRolePelayan] = useState<RolePelayan[]>([]);

  const [pickRole, setPickRole] = useState<number>(0);

  async function handleGetAll() {
    isLoading.onTrue();

    try {
      const params = {
        page: activePage,
        limit: limitPage,
        filter: searchData,
      };

      const response = await rolePelayanService.getAll(params);
      setDataRolePelayan(response.data);
      setTotalData(response.totalData);
      setTotalPage(response.totalPage);
    } catch (error: any) {
      if (typeof error !== "string") {
        customNotification({
          type: "Error",
          text: error || "Something went wrong",
        });
      }
      setDataRolePelayan([]);
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

  async function handleDelete(data: RolePelayan) {
    isLoading.onTrue();

    try {
      const response = await rolePelayanService.delete(data.id);

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

  const alertRemove = (data: RolePelayan) => {
    confirmSwal({
      title: "Apakah Yakin Menghapus Data ?",
      labelConfirm: "Yes",
      onConfirm: () => {
        handleDelete(data);
      },
    });
  };

  const menuSettings = (data: RolePelayan) => [
    {
      label: "",
      menu: [
        {
          name: "Detail",
          color: "blue",
          icon: <IconEye size={14} />,
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
        {dataRolePelayan && dataRolePelayan.length > 0 ? (
          <Fragment>
            {dataRolePelayan.map((data, index) => (
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
        isOpenModal={isOpenModalDetail}
        idRole={pickRole}
        handleGetAll={handleGetAll}
        withEditButton={isAdmin || !!haveAccessUpdate}
      />
    </>
  );
};

export default Manage;
