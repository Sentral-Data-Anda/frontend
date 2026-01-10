"use client";

import { useBoolean, useZustandStore } from "@/hooks";
import { useHooksPagination } from "@/hooks/usePagination";
import { Role } from "@/types";
import { confirmSwal } from "@/utils/alertSwal";
import {
  ActionIcon,
  Checkbox,
  Table,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { IconDotsVertical, IconEye, IconTrash } from "@tabler/icons-react";
import { Fragment, useEffect, useState } from "react";
import { customNotification } from "@/utils/notification";
import {
  DropdownMenuComponent,
  FilterMenu,
  TableComponent,
} from "@/components";
import ModalCreate from "./ModalCreate";
import ModalDetail from "./ModalDetail";
import { roleService } from "@/services";

const headerTable = [
  {
    name: "No",
  },
  {
    name: "Nama",
  },
  {
    name: "Admin",
  },
  { name: "" },
];

const Manage = () => {
  const theme = useMantineTheme();

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

  const { detailUser } = useZustandStore();

  const isAdmin = detailUser?.roleUser?.isAdmin;

  const haveAccessCreate = detailUser?.roleUser?.access?.find(
    (item) => item.name === "Create Role User",
  );
  const haveAccessUpdate = detailUser?.roleUser?.access?.find(
    (item) => item.name === "Update Role User",
  );
  const haveAccessDelete = detailUser?.roleUser?.access?.find(
    (item) => item.name === "Delete Role User",
  );

  const isLoading = useBoolean();

  const isOpenModalCreate = useBoolean();

  const isOpenModalDetail = useBoolean();

  const [dataRole, setDataRole] = useState<Role[]>([]);

  const [pickRole, setPickRole] = useState<number>(0);

  async function handleGetAll() {
    isLoading.onTrue();

    try {
      const params = {
        page: activePage,
        limit: limitPage,
        filter: searchData,
      };

      const response = await roleService.getAll(params);
      setDataRole(response.data);
      setTotalData(response.totalData);
      setTotalPage(response.totalPage);
    } catch (error: any) {
      if (typeof error !== "string") {
        customNotification({
          type: "Error",
          text: error || "Something went wrong",
        });
      }
      setDataRole([]);
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

  async function handleDeleteRole(data: Role) {
    isLoading.onTrue();

    try {
      const response = await roleService.delete(data.id);

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

  const alertRemove = (data: Role) => {
    confirmSwal({
      title: "Apakah Anda Yakin Menhapus Data ?",
      labelConfirm: "Yes",
      onConfirm: () => {
        handleDeleteRole(data);
      },
    });
  };

  const menuSettings = (data: Role) => [
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
        {dataRole && dataRole.length > 0 ? (
          <Fragment>
            {dataRole.map((data: Role, index: number) => (
              <Table.Tr key={index}>
                <Table.Td ta={"center"} w={50}>
                  <Text size="xs">
                    {(activePage - 1) * limitPage + index + 1}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="xs">{data.name}</Text>
                </Table.Td>
                <Table.Td ta={"center"} w={70}>
                  <Checkbox
                    size="14px"
                    checked={data.isAdmin}
                    color={theme.colors.success[9]}
                    iconColor={theme.colors.success[1]}
                    w={"100%"}
                    style={{
                      justifyItems: "center",
                      opacity: 1,
                    }}
                    readOnly
                  />
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
        idRole={pickRole}
        isOpenModal={isOpenModalDetail}
        handleGetAll={handleGetAll}
        withEditButton={isAdmin || !!haveAccessUpdate}
      />
    </>
  );
};

export default Manage;
