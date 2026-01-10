"use client";

import { useBoolean } from "@/hooks";
import { reportService } from "@/services";
import { ReportCountJemaat } from "@/types";
import { customNotification } from "@/utils";
import { Grid, Paper, Skeleton, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import CardJemaat from "./CardJemaat";
import CardBloodType from "./CardBloodType";
import CardRangeAge from "./CardRangeAge";
import CardEtnicGroup from "./CardEtnicGroup";
import CardProfession from "./CardProfession";
import CardBirthDate from "./CardBirthDate";
import dayjs from "dayjs";

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
        <Skeleton
          visible={isLoadingCountJemaat.value}
          mih={{ base: 255, sm: 127 }}>
          <Grid gutter="xs">
            {dataCountJemaat && dataCountJemaat.length > 0 && (
              <>
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <CardJemaat
                    name="Total Jemaat"
                    countMan={dataCountJemaat.reduce(
                      (sum, item) => sum + item.L,
                      0,
                    )}
                    countWoman={dataCountJemaat.reduce(
                      (sum, item) => sum + item.P,
                      0,
                    )}
                  />
                </Grid.Col>

                {dataCountJemaat.map((value, index) => {
                  const formatName =
                    value.typeJemaat === "ANGGOTA"
                      ? "Anggota"
                      : value.typeJemaat === "ANAK"
                      ? "Anak"
                      : "Simpatisan";

                  return (
                    <Grid.Col span={{ base: 6, sm: 3 }} key={index}>
                      <CardJemaat
                        name={formatName}
                        countMan={value.L}
                        countWoman={value.P}
                      />
                    </Grid.Col>
                  );
                })}
              </>
            )}
          </Grid>
        </Skeleton>
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6 }}>
        <Paper shadow="sm" radius="md" p="xs" withBorder>
          <Text size="md" fw={600}>
            Golongan Darah
          </Text>
          <CardBloodType />
        </Paper>
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6 }}>
        <Paper shadow="sm" radius="md" p="xs" withBorder>
          <Text size="md" fw={600}>
            Umur
          </Text>
          <CardRangeAge />
        </Paper>
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6 }}>
        <Paper shadow="sm" radius="md" p="xs" withBorder>
          <Text size="md" fw={600}>
            Suku
          </Text>
          <CardEtnicGroup />
        </Paper>
      </Grid.Col>
      <Grid.Col span={{ base: 12, sm: 6 }}>
        <Paper shadow="sm" radius="md" p="xs" withBorder>
          <Text size="md" fw={600}>
            Pekerjaan
          </Text>
          <CardProfession />
        </Paper>
      </Grid.Col>
      <Grid.Col span={12}>
        <Paper shadow="sm" radius="md" p="xs" withBorder>
          <Text size="md" fw={600}>
            Daftar Ulang Tahun Bulan {dayjs().format("MMMM")}
          </Text>
          <CardBirthDate />
        </Paper>
      </Grid.Col>
    </Grid>
  );
};

export default ManageReportJemaat;
