import { useBoolean } from "@/hooks";
import { reportService } from "@/services";
import { ReportProfession } from "@/types";
import { customNotification } from "@/utils";
import { Flex, Skeleton } from "@mantine/core";
import { useEffect, useState } from "react";
import { BarChart } from "@mantine/charts";

const CardProfession = () => {
  const isLoading = useBoolean();

  const [data, setData] = useState<ReportProfession[]>([]);

  async function handleGetData() {
    isLoading.onTrue();

    try {
      const response = await reportService.jemaatByProfession();

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
    <Skeleton visible={isLoading.value}>
      <Flex direction={"column"} justify={"center"} align={"center"} mih={300}>
        <BarChart
          h={300}
          data={data}
          dataKey="Profession"
          series={[
            {
              name: "Count",
              label: "Jumlah",
              color: "#FF9B9B",
            },
          ]}
          orientation="vertical"
          tickLine="none"
          gridAxis="none"
          minBarSize={10}
          maxBarWidth={30}
          withTooltip={false}
          yAxisProps={{
            width: 120,
          }}
        />
      </Flex>
    </Skeleton>
  );
};

export default CardProfession;
