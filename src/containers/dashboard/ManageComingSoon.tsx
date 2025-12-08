"use client";

import { useBoolean } from "@/hooks";
import { Events } from "@/types";
import { customNotification } from "@/utils/notification";
import { formatDateRange } from "@/utils/general";
import {
  Flex,
  Group,
  SimpleGrid,
  Skeleton,
  Table,
  Text,
  Stack,
} from "@mantine/core";

import { useEffect, useState } from "react";

import dayjs from "dayjs";
import { BadgeComponent, CardPhotoComponent } from "@/components";
import { eventService } from "@/services";
import Image from "next/image";
import Empty from "../../assets/picture/empty.png";

import { SwiperSlide, Swiper } from "swiper/react";
import { Autoplay, Pagination, Mousewheel } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const ManageComingSoon = () => {
  const isLoading = useBoolean();

  const [dataEvents, setDataEvents] = useState<Events[]>([]);

  async function handleGetAllEvents() {
    isLoading.onTrue();

    try {
      const params = {
        page: 1,
        limit: 9999,
        startDate: dayjs().startOf("month").format("YYYY-MM-DD"),
        endDate: dayjs().endOf("month").format("YYYY-MM-DD"),
      };

      const response = await eventService.getAll(params);

      setDataEvents(response.data);
    } catch (error: any) {
      if (typeof error !== "string") {
        customNotification({
          type: "Error",
          text: error || "Something went wrong",
        });
      }
      setDataEvents([]);
    } finally {
      isLoading.onFalse();
    }
  }

  useEffect(() => {
    handleGetAllEvents();
  }, []);

  return (
    <>
      <Flex direction={"column"} gap={15}>
        <Flex align={"center"} justify={"space-between"}>
          <Text size="sm" ta={"start"} fw={500}>
            Event Bulan Ini
          </Text>
        </Flex>
        <Skeleton visible={isLoading.value}>
          {dataEvents && dataEvents.length > 0 ? (
            <Swiper
              spaceBetween={30}
              centeredSlides={true}
              autoplay={{
                delay: 3500,
                disableOnInteraction: false,
              }}
              pagination={{
                clickable: true,
              }}
              navigation={false}
              mousewheel
              modules={[Autoplay, Pagination, Mousewheel]}
              style={{ width: "100%", height: 350, justifyItems: "center" }}
              className="mySwiper">
              {dataEvents.map((value: Events, index: number) => {
                const title = (
                  <Flex direction={"column"} align={"start"} gap={5}>
                    <Group gap={2}>
                      <BadgeComponent
                        color={value.isPaid ? "yellow" : "green"}
                        size="xs"
                        radius="md"
                        text={value.isPaid ? "Paid" : "Free"}
                      />
                      <BadgeComponent
                        color={"blue"}
                        size="xs"
                        radius="md"
                        text={value.bapel.name}
                      />
                    </Group>
                    <Text size="sm" fw={500}>
                      {value.name}
                    </Text>
                  </Flex>
                );

                const description = (
                  <Table w={"100%"} withRowBorders={false} mt={"xs"}>
                    <Table.Tbody>
                      <Table.Tr>
                        <Table.Td ta={"start"} w={"1%"} p={0}>
                          <Text c="dimmed" size="xs" p={0}>
                            Tanggal
                          </Text>
                        </Table.Td>
                        <Table.Td ta={"center"} px={1.5} py={1}>
                          <Text c="dimmed" size="xs" p={0}>
                            :
                          </Text>
                        </Table.Td>
                        <Table.Td ta={"start"} p={0}>
                          <Text c="dimmed" size="xs">
                            {formatDateRange(value.startDate, value.endDate)}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td ta={"start"} w={"1%"} p={0}>
                          <Text c="dimmed" size="xs" p={0}>
                            Peserta
                          </Text>
                        </Table.Td>
                        <Table.Td ta={"center"} px={1.5} py={1}>
                          <Text c="dimmed" size="xs" p={0}>
                            :
                          </Text>
                        </Table.Td>
                        <Table.Td ta={"start"} p={0}>
                          <Text c="dimmed" size="xs">
                            {value.capacity}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                      <Table.Tr>
                        <Table.Td ta={"start"} w={"1%"} p={0}>
                          <Text c="dimmed" size="xs" p={0}>
                            Lokasi
                          </Text>
                        </Table.Td>
                        <Table.Td ta={"center"} px={1.5} py={1}>
                          <Text c="dimmed" size="xs" p={0}>
                            :
                          </Text>
                        </Table.Td>
                        <Table.Td ta={"start"} p={0}>
                          <Text c="dimmed" size="xs">
                            {value.isIndoor
                              ? `R. ${value.room.name}`
                              : value.location}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    </Table.Tbody>
                  </Table>
                );

                return (
                  <SwiperSlide key={index}>
                    <SimpleGrid cols={1} spacing={"sm"}>
                      <CardPhotoComponent
                        key={index}
                        title={title}
                        buttonDetail={false}
                        mainImage={`${value.image.path}`}
                        description={description}
                      />
                    </SimpleGrid>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          ) : (
            <Stack
              w={"100%"}
              mih={225}
              h={"100%"}
              justify="center"
              align="center"
              style={{
                opacity: 0.15,
                WebkitFilter: "grayscale(100%)" /* Safari 6.0 - 9.0 */,
                filter: "grayscale(100%)",
              }}>
              <Image loading="lazy" src={Empty} alt="empty" width={90} />
              <Text size="xl">Empty Data</Text>
            </Stack>
          )}
        </Skeleton>
      </Flex>
    </>
  );
};

export default ManageComingSoon;
