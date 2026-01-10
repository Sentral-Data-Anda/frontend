"use client";

import {
  ActionIcon,
  Button,
  Flex,
  Grid,
  Group,
  Stack,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { MonthPickerInput } from "@mantine/dates";
import {
  IconCalendarWeek,
  IconClock,
  IconDoor,
  IconEdit,
  IconEye,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

import { Agenda } from "@/types";
import { useBoolean } from "@/hooks";
import { useHooksPagination } from "@/hooks/usePagination";
import { customNotification } from "@/utils/notification";
import InfiniteScroll from "react-infinite-scroll-component";
import { useZustandStore } from "@/hooks";
import { confirmSwal } from "@/utils/alertSwal";
import ModalCreate from "./ModalCreate";
import ModalDetail from "./ModalDetail";
import {
  BadgeComponent,
  ButtonComponent,
  CalendarPerWeek,
  DropdownRoom,
  EmptyData,
  ModalViewImage,
  SearchComponent,
} from "@/components";
import { loanRoomService } from "@/services";
import { extractErrorMessage } from "@/utils";

const Manage = () => {
  const {
    activePage,
    searchData,
    setSearchData,
    setActivePage,
    setTotalPage,
    setTotalData,
  } = useHooksPagination();

  const { detailUser } = useZustandStore();

  const isAdmin = detailUser?.roleUser?.isAdmin;

  const haveAccessCreate = detailUser?.roleUser?.access?.find(
    (item) => item.name === "Create Agenda",
  );
  const haveAccessUpdate = detailUser?.roleUser?.access?.find(
    (item) => item.name === "Update Agenda",
  );
  const haveAccessDelete = detailUser?.roleUser?.access?.find(
    (item) => item.name === "Delete Agenda",
  );

  const theme = useMantineTheme();

  const today = dayjs();

  const icon = <IconCalendarWeek size={18} stroke={1.5} />;

  const [chooseMonth, setChooseMonth] = useState<string | null>(
    today.format("YYYY-MM-DD"),
  );

  const [chooseDate, setChooseDate] = useState<string>("");

  const [startDate, setStartDate] = useState<string>("");

  const [endDate, setEndDate] = useState<string>("");

  const [chooseRoom, setChooseRoom] = useState<string | null>(null);

  const isLoading = useBoolean();

  const isOpenModalCreate = useBoolean();

  const isOpenModalDetail = useBoolean();

  const isOpenModalImage = useBoolean();

  const [hasMore, setHasMore] = useState<boolean>(true);

  const [dataAgenda, setDataAgenda] = useState<Agenda[]>([]);

  const [pickAgenda, setPickAgenda] = useState<string>("");

  const [detailImage, setDetailImage] = useState<string[]>([]);

  const limitPage: number = 10;

  async function handleGetAll() {
    setHasMore(true);

    isLoading.onTrue();

    try {
      const params = {
        page: activePage,
        limit: limitPage,
        filter: searchData,
        date: chooseDate ? chooseDate : null,
        startDate: startDate ? startDate : null,
        endDate: endDate ? endDate : null,
        roomId: chooseRoom,
      };

      if (chooseDate || (startDate !== "" && endDate !== "")) {
        const response = await loanRoomService.getAll(params);

        if (activePage === 1) {
          setDataAgenda(response.data);
        } else {
          setDataAgenda((prev) => [...prev, ...response.data]);
        }

        if (response.totalPage === activePage) {
          setHasMore(false);
        }

        setTotalData(response.totalData);
        setTotalPage(response.totalPage);
      }
    } catch (error: any) {
      if (typeof error !== "string") {
        customNotification({
          type: "Error",
          text: error || "Something went wrong",
        });
      }
      setDataAgenda([]);
      setTotalData(0);
      setTotalPage(0);
      setHasMore(false);
    } finally {
      isLoading.onFalse();
    }
  }

  useEffect(() => {
    setDataAgenda([]);
    setActivePage(1);
    setHasMore(true);
  }, [searchData, chooseRoom, chooseDate, startDate, endDate]);

  useEffect(() => {
    if (activePage === 1) {
      handleGetAll();
    }
  }, [activePage, searchData, chooseRoom, chooseDate, startDate, endDate]);

  useEffect(() => {
    if (activePage > 1) {
      handleGetAll();
    }
  }, [activePage]);

  async function handleDelete(data: Agenda) {
    isLoading.onTrue();

    try {
      const response = await loanRoomService.delete(data.code);

      if (response && response.status === 200) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            handleGetAll();
            isLoading.onFalse();
          },
        );
      }
    } catch (error: any) {
      customNotification({
        type: typeof error === "string" ? "Warning" : "Error",
        text: extractErrorMessage(error),
      }).then(() => isLoading.onFalse());
    }
  }

  const alertRemove = (data: Agenda) => {
    confirmSwal({
      title: "Apakah Yakin Membatalkan Agenda ?",
      labelConfirm: "Yes",
      onConfirm: () => {
        handleDelete(data);
      },
    });
  };

  return (
    <>
      <Flex direction="column" gap="sm">
        <Grid gutter={"xs"}>
          <Grid.Col span={isAdmin || haveAccessCreate ? 7 : 12}>
            <MonthPickerInput
              size="xs"
              radius="md"
              value={chooseMonth}
              onChange={(value) => {
                setChooseMonth(value);
              }}
              placeholder="Pilih Bulan"
              clearable
              valueFormat="MMMM YYYY"
              leftSection={icon}
              styles={{
                input: { minHeight: 32, height: 32 },
              }}
            />
          </Grid.Col>

          {isAdmin || haveAccessCreate ? (
            <Grid.Col span={5}>
              <ButtonComponent
                name="New"
                icon={<IconPlus size={15} stroke={1.5} />}
                onClick={() => {
                  isOpenModalCreate.onTrue();
                }}
                disabled={
                  new Date(chooseDate) < new Date(today.format("YYYY-MM-DD"))
                }
              />
            </Grid.Col>
          ) : null}
        </Grid>

        {chooseMonth !== null ? (
          <>
            <CalendarPerWeek
              value={chooseDate}
              onChange={setChooseDate}
              chooseMonth={chooseMonth}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
            />

            <Grid gutter={"xs"}>
              <Grid.Col span={7}>
                <SearchComponent onChange={setSearchData} />
              </Grid.Col>
              <Grid.Col span={5}>
                <DropdownRoom value={chooseRoom} onChange={setChooseRoom} />
              </Grid.Col>
            </Grid>
            {dataAgenda.length > 0 ? (
              <InfiniteScroll
                dataLength={dataAgenda.length}
                next={() => {
                  setTimeout(() => {
                    setActivePage((prev) => prev + 1);
                  }, 800);
                }}
                hasMore={hasMore}
                loader={
                  <Flex justify={"center"} mt={10}>
                    <div className="loader-table"></div>
                  </Flex>
                }>
                <Stack gap="xs">
                  {dataAgenda && dataAgenda.length > 0
                    ? dataAgenda.map((data: Agenda, index: number) => {
                        const agendaEnd = dayjs(
                          `${data.date.substring(0, 10)} ${data.endTime}`,
                        );
                        const isPast = agendaEnd.isBefore(today);
                        return (
                          <Flex
                            key={index}
                            bg={isPast ? "#e5e7eb89" : "white"}
                            align={"center"}
                            style={{
                              borderRadius: 10,
                              boxShadow: "inset 0 0 0 1.5px #F3F4F6",
                            }}>
                            <Flex
                              p={"xs"}
                              direction={"column"}
                              w={"100%"}
                              gap={10}>
                              <Flex
                                justify={"space-between"}
                                w={"100%"}
                                align={"center"}>
                                <Text size="sm" fw={600}>
                                  {data.purpose ?? "'"}
                                </Text>

                                <ActionIcon
                                  radius="md"
                                  size={24}
                                  variant="light"
                                  color="indigo"
                                  aria-label="Detail Room"
                                  onClick={() => {
                                    isOpenModalImage.onTrue();
                                    setDetailImage(data.room.image);
                                  }}>
                                  <IconEye
                                    style={{ width: "70%", height: "70%" }}
                                    stroke={1.5}
                                  />
                                </ActionIcon>
                              </Flex>

                              <Flex direction={"column"} gap={5}>
                                {chooseDate === "" ? (
                                  <Flex align={"center"} gap={5}>
                                    <IconCalendarWeek
                                      style={{ width: 17, height: 17 }}
                                      stroke={1}
                                    />

                                    <Text
                                      size="xs"
                                      fw={400}
                                      style={{
                                        textWrap: "nowrap",
                                        opacity: 0.5,
                                      }}>
                                      {dayjs(data.date).format("DD MMMM YYYY")}
                                    </Text>
                                  </Flex>
                                ) : null}

                                <Flex align={"center"} gap={5}>
                                  <IconClock
                                    style={{ width: 17, height: 17 }}
                                    stroke={1}
                                  />

                                  <Text
                                    size="xs"
                                    fw={400}
                                    style={{
                                      textWrap: "nowrap",
                                      opacity: 0.5,
                                    }}>
                                    {`${data.startTime} - ${data.endTime}`}
                                  </Text>
                                </Flex>

                                <Flex w={"100%"} justify={"space-between"}>
                                  <Flex align={"center"} gap={5}>
                                    <IconDoor
                                      style={{ width: 17, height: 17 }}
                                      stroke={1}
                                    />

                                    <Text
                                      size="xs"
                                      fw={400}
                                      style={{
                                        textWrap: "nowrap",
                                        opacity: 0.5,
                                      }}>
                                      {data.room.name
                                        ? `R. ${data.room.name}`
                                        : ""}
                                    </Text>
                                  </Flex>

                                  <BadgeComponent
                                    color={"blue"}
                                    size="xs"
                                    radius="md"
                                    text={data.bapel.name}
                                  />
                                </Flex>
                              </Flex>

                              {!isPast && detailUser?.id === data.createdBy ? (
                                <Group grow py={5} gap={"xs"}>
                                  <Button
                                    disabled={!!haveAccessUpdate}
                                    leftSection={<IconEdit size={14} />}
                                    size="xs"
                                    variant="light"
                                    color={theme.colors.default[9]}
                                    onClick={() => {
                                      isOpenModalDetail.onTrue();
                                      setPickAgenda(data.code);
                                    }}>
                                    Perbarui
                                  </Button>
                                  <Button
                                    disabled={!!haveAccessDelete}
                                    leftSection={<IconTrash size={14} />}
                                    size="xs"
                                    variant="outline"
                                    color={"red"}
                                    onClick={() => alertRemove(data)}>
                                    Batalkan
                                  </Button>
                                </Group>
                              ) : null}
                            </Flex>
                          </Flex>
                        );
                      })
                    : null}
                </Stack>
              </InfiniteScroll>
            ) : isLoading.value && activePage === 1 ? (
              <Flex justify={"center"} mt={"28vh"}>
                <div className="loader-table"></div>
              </Flex>
            ) : (
              <EmptyData />
            )}
          </>
        ) : null}
      </Flex>

      <ModalCreate
        chooseDate={chooseDate}
        isOpenModal={isOpenModalCreate}
        handleGetAll={handleGetAll}
      />

      <ModalDetail
        codeAgenda={pickAgenda}
        isOpenModal={isOpenModalDetail}
        handleGetAll={handleGetAll}
        withEditButton={isAdmin || !!haveAccessUpdate}
      />

      <ModalViewImage
        isOpenModal={isOpenModalImage}
        listImage={detailImage}
        titleModal={"Detail Gambar Ruangan"}
      />
    </>
  );
};

export default Manage;
