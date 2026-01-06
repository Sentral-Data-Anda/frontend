import { TableComponent } from "@/components";
import { useBoolean } from "@/hooks";
import { reportService } from "@/services";
import { ReportBirthMonth } from "@/types";
import { customNotification } from "@/utils";
import { Table, Text } from "@mantine/core";
import dayjs from "dayjs";
import { Fragment, useEffect, useState } from "react";

const headerTable = [
  {
    name: "Jemaat Berulang Tahun Bulan Ini",
    colSpan: 4,
  },
];

const TableBirthMonth = () => {
  const isLoading = useBoolean();

  const [data, setData] = useState<ReportBirthMonth[]>([]);

  async function handleGetData() {
    isLoading.onTrue();

    const monthNow = dayjs().format("M");

    try {
      const response = await reportService.jemaatBirthByMonth(monthNow);

      setData(response.data);
    } catch (error: any) {
      if (typeof error !== "string") {
        customNotification({
          type: "Error",
          text: error || "Something went wrong",
        });
      }
      setData([]);
    } finally {
      isLoading.onFalse();
    }
  }

  useEffect(() => {
    handleGetData();
  }, []);

  return (
    <TableComponent
      minWidth={0}
      maxHeight={200}
      loading={isLoading.value}
      typeHeader="basic"
      mainHeader={headerTable}
      activePage={0}
      totalData={0}
      totalPage={0}
      limitData={0}
      setActivePage={() => {}}>
      {data && data.length > 0 ? (
        <Fragment>
          {data.map((data, index) => (
            <Table.Tr key={index}>
              <Table.Td ta={"center"} w={20}>
                <Text size="xs">{index + 1}</Text>
              </Table.Td>
              <Table.Td ta={"start"}>
                <Text size="xs">{data.name}</Text>
              </Table.Td>
              <Table.Td ta={"center"}>
                <Text size="xs">{data.gender}</Text>
              </Table.Td>
              <Table.Td ta={"center"}>
                <Text size="xs">{data.birthDate}</Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Fragment>
      ) : null}
    </TableComponent>
  );
};

export default TableBirthMonth;
