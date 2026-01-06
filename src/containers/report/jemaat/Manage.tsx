"use client";

import { useBoolean } from "@/hooks";
import { reportService } from "@/services";
import { ReportCountJemaat } from "@/types";
import { customNotification } from "@/utils";
import { Grid, Paper, Skeleton } from "@mantine/core";
import { useEffect, useState } from "react";
import CardJemaat from "./CardJemaat";
import TableBirthMonth from "./TableBirthMonth";

const ManageReportJemaat = () => {
  const isLoadingCountJemaat = useBoolean();

  const [dataCountJemaat, setDataCountJemaat] = useState<ReportCountJemaat[]>(
    [],
  );

  async function handleGetCountJemaat() {
    isLoadingCountJemaat.onTrue();

    try {
      const response = await reportService.jemaatByTypeAndGender();

      setDataCountJemaat(response.data);
    } catch (error: any) {
      if (typeof error !== "string") {
        customNotification({
          type: "Error",
          text: error || "Something went wrong",
        });
      }
      setDataCountJemaat([]);
    } finally {
      isLoadingCountJemaat.onFalse();
    }
  }

  useEffect(() => {
    handleGetCountJemaat();
  }, []);

  return (
    <Grid gutter="xs">
      <Grid.Col span={12}>
        <Paper shadow="sm" radius="md" p="xs" withBorder>
          <Skeleton visible={isLoadingCountJemaat.value}>
            <Grid gutter="xs">
              {dataCountJemaat && dataCountJemaat.length > 0
                ? dataCountJemaat.map((value, index) => {
                    const formatName =
                      value.typeJemaat === "ANGGOTA"
                        ? "Jemaat"
                        : value.typeJemaat === "ANAK"
                        ? "Anak"
                        : "Simpatisan";

                    const listColor = ["green", "red", "orange"];
                    return (
                      <Grid.Col span={4} key={index}>
                        <CardJemaat
                          name={formatName}
                          color={listColor[index]}
                          countMan={value.L}
                          countWoman={value.P}
                        />
                      </Grid.Col>
                    );
                  })
                : null}
            </Grid>
          </Skeleton>
        </Paper>
      </Grid.Col>
      <Grid.Col span={12}>
        <TableBirthMonth />
      </Grid.Col>
    </Grid>
  );
};

export default ManageReportJemaat;
