import { useBoolean } from "@/hooks";
import { reportService } from "@/services";
import { ReportBirthMonth } from "@/types";
import { customNotification } from "@/utils";
import { Avatar, Flex, Grid, ScrollArea, Skeleton, Text } from "@mantine/core";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { BadgeComponent } from "@/components";

const CardBirthDate = () => {
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
    <Skeleton visible={isLoading.value}>
      <ScrollArea
        h={300}
        type="always"
        offsetScrollbars
        scrollbarSize={8}
        mt={10}>
        <Grid gutter={"xs"}>
          {data && data.length > 0
            ? data.map((value, index) => {
                return (
                  <Grid.Col span={{ base: 12, sm: 6 }} key={index}>
                    <Flex
                      bg={"white"}
                      align={"center"}
                      style={{
                        cursor: "pointer",
                        borderRadius: 10,
                        boxShadow: "inset 0 0 0 1.5px #F3F4F6",
                      }}>
                      <Flex
                        flex={1}
                        p="xs"
                        bdrs={7}
                        justify={"space-between"}
                        direction={"column"}>
                        <Flex gap={10} align={"center"}>
                          <Avatar
                            key={value.name}
                            name={value.name}
                            color={value.gender === "L" ? "blue" : "red"}
                            allowedInitialsColors={["blue", "red"]}
                            size={35}
                          />

                          <Flex direction={"column"} w={"100%"} gap={5}>
                            <Text
                              size="sm"
                              fw={600}
                              style={{
                                textWrap: "nowrap",
                              }}>
                              {value.name ?? "Default Jemaat"}
                            </Text>

                            <Flex align={"center"} justify={"space-between"}>
                              <Text
                                size="xs"
                                fw={400}
                                style={{
                                  textWrap: "nowrap",
                                  opacity: 0.5,
                                }}>
                                {value.birthDate
                                  ? dayjs(value.birthDate).format("DD MMMM")
                                  : "-"}
                              </Text>

                              <BadgeComponent
                                variant="light"
                                color={"#215E61"}
                                text={`${value.umur} Tahun`}
                                radius={"xs"}
                                size="xs"
                              />
                            </Flex>
                          </Flex>
                        </Flex>
                      </Flex>
                    </Flex>
                  </Grid.Col>
                );
              })
            : null}
        </Grid>
      </ScrollArea>
    </Skeleton>
  );
};

export default CardBirthDate;
