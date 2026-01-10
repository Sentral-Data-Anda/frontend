import { useBoolean } from "@/hooks";
import { reportService } from "@/services";
import { ReportRangeAge } from "@/types";
import { customNotification } from "@/utils";
import { Flex, Skeleton } from "@mantine/core";
import { useEffect, useState } from "react";
import { BarChart } from "@mantine/charts";

const CardRangeAge = () => {
  const isLoading = useBoolean();

  const [data, setData] = useState<ReportRangeAge[]>([]);

  async function handleGetData() {
    isLoading.onTrue();

    try {
      const response = await reportService.jemaatByAge();

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
          dataKey="Umur"
          series={[
            {
              name: "Count",
              label: "Jumlah",
              color: "#5F9598",
            },
          ]}
          tickLine="none"
          gridAxis="none"
          orientation="vertical"
          minBarSize={10}
          maxBarWidth={30}
          withTooltip={false}
        />
      </Flex>
    </Skeleton>
  );
};

export default CardRangeAge;
