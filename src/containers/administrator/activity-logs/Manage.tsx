"use client";

import { useBoolean } from "@/hooks";
import { useHooksPagination } from "@/hooks/usePagination";
import { Logs } from "@/types";
import { customNotification } from "@/utils/notification";
import { Flex, Grid, Table, Text } from "@mantine/core";
import dayjs from "dayjs";
import { IoMdArrowDropdown } from "react-icons/io";

import { Fragment, useEffect, useState } from "react";
import { activityLogService } from "@/services";
import {
  DateInputComponent,
  DropdownComponent,
  TableComponent,
} from "@/components";

const listAction = [
  {
    label: "CREATE",
    value: "create",
  },
  {
    label: "UPDATE",
    value: "update",
  },
  {
    label: "DELETE",
    value: "delete",
  },
];

const headerTable = [
  {
    name: "No",
  },
  {
    name: "User",
  },
  { name: "Action" },
  { name: "Model" },
  { name: "Date & Time" },
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
  } = useHooksPagination();

  const limitPage: number = 10;

  const isLoading = useBoolean();

  const [chooseRow, setChooseRow] = useState<number | null>(null);

  const [chooseAction, setChooseAction] = useState<string | null>(null);

  const [chooseDate, setChooseDate] = useState<string | null>(null);

  const [dataLogs, setDataLogs] = useState<Logs[]>([]);

  async function handleGetAllLogs() {
    isLoading.onTrue();

    try {
      const params = {
        page: activePage,
        limit: limitPage,
        action: chooseAction,
        date: chooseDate !== null ? dayjs(chooseDate).format("YYYY-MM-DD") : "",
      };

      const response = await activityLogService.getAll(params);
      setDataLogs(response.data);
      setTotalData(response.totalData);
      setTotalPage(response.totalPage);
    } catch (error: any) {
      if (typeof error !== "string") {
        customNotification({
          type: "Error",
          text: error || "Something went wrong",
        });
      }
      setDataLogs([]);
      setTotalData(0);
      setTotalPage(0);
    } finally {
      isLoading.onFalse();
    }
  }

  useEffect(() => {
    setActivePage(1);
  }, [chooseAction, chooseDate]);

  useEffect(() => {
    handleGetAllLogs();
  }, [activePage, chooseAction, chooseDate]);

  return (
    <>
      <Grid w={"100%"} grow gutter={"xs"}>
        <Grid.Col span={6}>
          <DropdownComponent
            placeholder="Action"
            data={listAction}
            withLabel
            value={chooseAction}
            onChange={setChooseAction}
          />
        </Grid.Col>
        <Grid.Col span={6}>
          <DateInputComponent
            label="Date"
            value={chooseDate}
            onChange={setChooseDate}
          />
        </Grid.Col>
      </Grid>

      <TableComponent
        loading={isLoading.value}
        typeHeader="basic"
        mainHeader={headerTable}
        activePage={activePage}
        totalData={totalData}
        totalPage={totalPage}
        limitData={limitPage}
        setActivePage={setActivePage}>
        {dataLogs && dataLogs.length > 0 ? (
          <Fragment>
            {dataLogs.map((data, index) => {
              return (
                <Fragment key={index}>
                  <Table.Tr
                    style={{
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      if (data.id !== chooseRow) {
                        setChooseRow(data.id);
                      } else {
                        setChooseRow(null);
                      }
                    }}>
                    <Table.Td ta={"center"} w={50}>
                      <Text size="xs">
                        {(activePage - 1) * limitPage + index + 1}
                      </Text>
                    </Table.Td>
                    <Table.Td ta={"start"} maw={100}>
                      <Text size="xs">{data.user.name}</Text>
                    </Table.Td>
                    <Table.Td ta={"center"} maw={100}>
                      <Text size="xs">{data.action.toUpperCase()}</Text>
                    </Table.Td>
                    <Table.Td ta={"center"} maw={100}>
                      <Text size="xs">{data.model}</Text>
                    </Table.Td>
                    <Table.Td w={150}>
                      <Flex
                        gap={5}
                        justify={"center"}
                        direction={"column"}
                        w={"100%"}>
                        <Text size="xs" fw={500} ta={"start"}>
                          {dayjs(data.createdAt).format("DD MMMM YYYY")}
                        </Text>
                        <Text
                          size="xs"
                          fw={400}
                          ta={"end"}
                          style={{
                            opacity: 0.5,
                          }}>
                          {dayjs(data.createdAt).format("HH:mm:ss")}
                        </Text>
                      </Flex>
                    </Table.Td>
                    <Table.Td ta={"center"} w={30}>
                      <IoMdArrowDropdown
                        size={16}
                        style={{
                          rotate: data.id === chooseRow ? "-180deg" : "0deg",
                          transition: "rotate 0.5s",
                        }}
                      />
                    </Table.Td>
                  </Table.Tr>

                  {/* CHILD */}
                  {data.id === chooseRow ? (
                    <Table.Tr>
                      <Table.Td ta={"center"} colSpan={3} maw={100}>
                        <div
                          style={{
                            justifyContent: "flex-start",
                            minHeight: "300px",
                          }}>
                          <Text size="sm" fw={600} ta={"start"}>
                            Old Data:
                          </Text>
                          <pre
                            style={{
                              whiteSpace: "pre-wrap",
                              wordWrap: "break-word",
                              fontSize: "12px",
                              margin: "8px 0 0 0",
                              backgroundColor: "#fff",
                              padding: "12px",
                              borderRadius: "4px",
                              border: "1px solid #eee",
                              height: "300px",
                              overflowY: "auto",
                              textAlign: "start",
                            }}>
                            {data.oldData
                              ? JSON.stringify(
                                  JSON.parse(data.oldData),
                                  null,
                                  2,
                                )
                              : "No data"}
                          </pre>
                        </div>
                      </Table.Td>
                      <Table.Td ta={"center"} colSpan={3} maw={100}>
                        <div
                          style={{
                            justifyContent: "flex-start",
                            minHeight: "300px",
                          }}>
                          <Text size="sm" fw={600} ta={"start"}>
                            New Data:
                          </Text>
                          <pre
                            style={{
                              whiteSpace: "pre-wrap",
                              wordWrap: "break-word",
                              fontSize: "12px",
                              margin: "8px 0 0 0",
                              backgroundColor: "#fff",
                              padding: "12px",
                              borderRadius: "4px",
                              border: "1px solid #eee",
                              height: "300px",
                              overflowY: "auto",
                              textAlign: "start",
                            }}>
                            {data.newData
                              ? JSON.stringify(
                                  JSON.parse(data.newData),
                                  null,
                                  2,
                                )
                              : "No data"}
                          </pre>
                        </div>
                      </Table.Td>
                    </Table.Tr>
                  ) : null}
                </Fragment>
              );
            })}
          </Fragment>
        ) : null}
      </TableComponent>
    </>
  );
};

export default Manage;
