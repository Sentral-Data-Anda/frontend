import { useBoolean } from "@/hooks";
import { reportService } from "@/services";
import { ReportBloodType } from "@/types";
import { customNotification } from "@/utils";
import { Flex, Skeleton, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import { PieChart } from "@mantine/charts";
import { IconCircleFilled } from "@tabler/icons-react";

const CardBloodType = () => {
  const isLoading = useBoolean();

  const [data, setData] = useState<ReportBloodType[]>([]);

  async function handleGetData() {
    isLoading.onTrue();

    try {
      const response = await reportService.jemaatByBloodType();

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

  const formatData = data.map((value, index) => {
    const color =
      value.bloodType === "A"
        ? "#F7E396"
        : value.bloodType === "B"
        ? "#AAC4F5"
        : value.bloodType === "O"
        ? "#F0A04B"
        : "#A888B5";

    return {
      key: index,
      name: value.bloodType,
      value: value.Count,
      color: color,
    };
  });

  return (
    <Skeleton visible={isLoading.value}>
      <Flex direction={"column"} justify={"center"} align={"center"} h={300}>
        <PieChart
          strokeWidth={2}
          withLabelsLine
          labelsPosition="outside"
          labelsType="percent"
          withLabels
          data={formatData}
          size={200}
        />

        <Flex align={"center"} gap="sm">
          {formatData && formatData.length > 0
            ? formatData.map((value, index) => {
                return (
                  <Flex align={"center"} gap={5} key={index}>
                    <IconCircleFilled
                      style={{ width: "12px", height: "12px" }}
                      stroke={1.5}
                      color={value.color}
                    />
                    <Text size="sm">
                      {value.name} : {value.value}
                    </Text>
                  </Flex>
                );
              })
            : null}
        </Flex>
      </Flex>
    </Skeleton>
  );
};

export default CardBloodType;
