import { useBoolean } from "@/hooks";
import { reportService } from "@/services";
import { ReportEtnicGroup } from "@/types";
import { customNotification } from "@/utils";
import { Flex, Skeleton } from "@mantine/core";
import { useEffect, useState } from "react";
import { BarChart } from "@mantine/charts";

const CardEtnicGroup = () => {
  const isLoading = useBoolean();

  const [data, setData] = useState<ReportEtnicGroup[]>([]);

  async function handleGetData() {
    isLoading.onTrue();

    try {
      const response = await reportService.jemaatByEtnic();

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
          dataKey="Suku"
          series={[
            {
              name: "Count",
              label: "Jumlah",
              color: "#FFB996",
            },
          ]}
          tickLine="none"
          gridAxis="none"
          minBarSize={10}
          maxBarWidth={30}
          withTooltip={false}
        />
      </Flex>
    </Skeleton>
  );
};

export default CardEtnicGroup;
