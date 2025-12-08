"use client";

import {
  CheckInputComponent,
  DateInputComponent,
  DropdownBapel,
  DropdownComponent,
  DropdownJemaat,
  DropdownRoom,
  ModalViewImage,
  TextInputComponent,
} from "@/components";
import { useBoolean, useZustandStore } from "@/hooks";
import { loanRoomService, ruanganService } from "@/services";
import { BookingAgenda, FormAgenda, ImageRuangan } from "@/types";
import { customNotification, extractErrorMessage, getTimeRange } from "@/utils";
import { ActionIcon, Flex, Grid } from "@mantine/core";
import { IconEye } from "@tabler/icons-react";
import dayjs from "dayjs";
import { ReactNode, useEffect, useState } from "react";

interface PropTypes {
  formAgenda: FormAgenda;
  setFormAgenda: (_value: FormAgenda) => void;
  isDisable: boolean;
  onSubmit: (_value: React.FormEvent<HTMLFormElement>) => void;
  button: ReactNode | null;
}

const Form = (props: PropTypes) => {
  const { formAgenda, setFormAgenda, isDisable, onSubmit, button } = props;

  const isLoading = useBoolean();

  const isLoadingImage = useBoolean();

  const isOpenModalImage = useBoolean();

  const { detailUser } = useZustandStore();

  const jemaatIdUser = detailUser?.jemaat?.id ?? null;

  const [listImage, setListImage] = useState<string[]>([]);

  const [dataBooking, setDataBooking] = useState<BookingAgenda[]>([]);

  async function handleGetAgendaBooking() {
    isLoading.onTrue();

    try {
      const params = {
        date: formAgenda?.date,
        roomId: formAgenda?.roomId,
      };

      const response = await loanRoomService.getBooking(params);

      setDataBooking(response.data);
    } catch (error: any) {
      if (typeof error !== "string") {
        customNotification({
          type: "Error",
          text: extractErrorMessage(error),
        });
      }
      setDataBooking([]);
    } finally {
      isLoading.onFalse();
    }
  }

  useEffect(() => {
    if (formAgenda.date && formAgenda.roomId) {
      handleGetAgendaBooking();
    }
  }, [formAgenda.date, formAgenda.roomId]);

  const today = dayjs();

  const times = getTimeRange("07:00", "22:00", 60);

  const optionsStart = times.map((time) => {
    const isToday =
      formAgenda?.date && dayjs(formAgenda.date).isSame(today, "day");

    const nowTime = today.format("HH:mm");

    const isPastTime = isToday && time < nowTime;

    const isSunday =
      formAgenda?.date && new Date(formAgenda.date).getDay() === 0; // 0 = Minggu

    const isBefore1PM = parseInt(time.split(":")[0]) < 13;

    const isBooked = dataBooking?.some((item) => {
      return time >= item.startTime && time < item.endTime;
    });

    return {
      value: time,
      label: time,
      disabled: Boolean(isPastTime || isBooked || (isSunday && isBefore1PM)),
    };
  });

  const optionsEnd = times.map((time) => {
    const selectedStart = formAgenda?.startTime ?? null;

    const isToday =
      formAgenda?.date && dayjs(formAgenda.date).isSame(today, "day");

    const nowTime = today.format("HH:mm");

    const isPastTime = isToday && time < nowTime;

    const isSunday =
      formAgenda?.date && new Date(formAgenda.date).getDay() === 0;

    const isBefore1PM = parseInt(time.split(":")[0]) < 13;

    const isBooked = dataBooking?.some((item) => {
      if (!selectedStart) return false;

      if (selectedStart < item.startTime) {
        return time > item.startTime;
      }

      return selectedStart >= item.startTime && selectedStart < item.endTime;
    });

    const beforeStart = selectedStart ? time <= selectedStart : false;

    return {
      value: time,
      label: time,
      disabled: Boolean(
        isPastTime || beforeStart || isBooked || (isSunday && isBefore1PM),
      ),
    };
  });

  async function handleGetDetailImage(params: string) {
    isLoadingImage.onTrue();

    try {
      const response = await ruanganService.getOne(params);

      const detailImage: string[] = [];

      if (response.data.mainImage?.path) {
        detailImage.push(response.data.mainImage.path);
      }

      if (response.data.detailImage?.length > 0) {
        const paths = response.data.detailImage.map(
          (img: ImageRuangan) => img.path,
        );

        detailImage.push(...paths);
      }

      setListImage(detailImage);
      isOpenModalImage.onTrue();
    } catch (error: any) {
      if (typeof error !== "string") {
        customNotification({
          type: "Error",
          text: extractErrorMessage(error),
        });
      }
      setDataBooking([]);
    } finally {
      isLoadingImage.onFalse();
    }
  }

  return (
    <>
      <form
        onSubmit={onSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}>
        <Grid w={"100%"} gutter={"xs"}>
          <Grid.Col span={{ base: 12 }}>
            <Flex gap={5} align={"end"} w={"100%"}>
              <DropdownRoom
                value={formAgenda?.roomId}
                onChange={(value) => {
                  setFormAgenda({
                    ...formAgenda,
                    roomId: value,
                    startTime: null,
                    endTime: null,
                  });
                  setListImage([]);
                }}
                withLabel
                require
                disabled={isDisable}
                withinPortal={false}
              />

              <ActionIcon
                radius="md"
                size={32}
                variant="light"
                color="indigo"
                aria-label="Detail Room"
                disabled={isDisable || formAgenda?.roomId === null}
                loading={isLoadingImage.value}
                onClick={() => {
                  if (formAgenda?.roomId) {
                    if (listImage.length > 0) {
                      isOpenModalImage.onTrue();
                    } else {
                      handleGetDetailImage(formAgenda?.roomId);
                    }
                  }
                }}>
                <IconEye style={{ width: "70%", height: "70%" }} stroke={1.5} />
              </ActionIcon>
            </Flex>
          </Grid.Col>
          <Grid.Col span={{ base: 12 }}>
            <DateInputComponent
              excludeDate={(date) => dayjs(date).isBefore(dayjs(), "day")}
              label="Tanggal"
              value={formAgenda?.date}
              onChange={(value) => {
                setFormAgenda({
                  ...formAgenda,
                  date: value,
                });
              }}
              require
              disabled={isDisable}
            />
          </Grid.Col>
          {formAgenda.date && formAgenda?.roomId ? (
            <>
              <Grid.Col span={{ base: 6 }}>
                <DropdownComponent
                  placeholder={"Dari Waktu"}
                  data={optionsStart ?? []}
                  value={formAgenda?.startTime}
                  onChange={(value) => {
                    setFormAgenda({
                      ...formAgenda,
                      startTime: value,
                      endTime: null,
                    });
                  }}
                  withLabel
                  require
                  disabled={isDisable}
                  disableSearch
                />
              </Grid.Col>
              <Grid.Col span={{ base: 6 }}>
                <DropdownComponent
                  placeholder={"Sampai Waktu"}
                  data={optionsEnd ?? []}
                  value={formAgenda?.endTime}
                  onChange={(value) =>
                    setFormAgenda({ ...formAgenda, endTime: value })
                  }
                  withLabel
                  require
                  disabled={
                    formAgenda?.startTime === "" ||
                    formAgenda?.startTime === null ||
                    isDisable
                  }
                  disableSearch
                />
              </Grid.Col>
            </>
          ) : null}
          {formAgenda?.roomId &&
          formAgenda?.startTime &&
          formAgenda?.endTime ? (
            <>
              <Grid.Col span={{ base: 12 }}>
                <DropdownJemaat
                  value={formAgenda?.jemaatId}
                  onChange={(value) =>
                    setFormAgenda({ ...formAgenda, jemaatId: value })
                  }
                  withLabel
                  require
                  disabled={
                    isDisable || formAgenda?.jemaatId === String(jemaatIdUser)
                  }
                  withinPortal={false}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12 }}>
                <CheckInputComponent
                  label="Pribadi"
                  value={formAgenda?.jemaatId === String(jemaatIdUser)}
                  onChange={(value) => {
                    if (value) {
                      setFormAgenda({
                        ...formAgenda,
                        jemaatId: String(jemaatIdUser),
                      });
                    } else {
                      setFormAgenda({
                        ...formAgenda,
                        jemaatId: null,
                      });
                    }
                  }}
                  disabled={isDisable}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12 }}>
                <TextInputComponent
                  name="Tujuan"
                  require
                  value={formAgenda?.purpose}
                  onChange={(e) =>
                    setFormAgenda({ ...formAgenda, purpose: e.target.value })
                  }
                  disabled={isDisable}
                  description={true}
                  maxChar={100}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12 }}>
                <DropdownBapel
                  value={formAgenda?.bapelId}
                  onChange={(value) =>
                    setFormAgenda({ ...formAgenda, bapelId: value })
                  }
                  withLabel
                  require
                  disabled={isDisable}
                  withinPortal={false}
                />
              </Grid.Col>
            </>
          ) : null}
        </Grid>

        {button}
      </form>

      <ModalViewImage
        isOpenModal={isOpenModalImage}
        listImage={listImage}
        titleModal={"Detail Gambar Ruangan"}
      />
    </>
  );
};

export default Form;
