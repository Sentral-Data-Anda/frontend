"use client";

import {
  ActionIcon,
  AppShell,
  Box,
  Flex,
  Text,
  useMantineTheme,
} from "@mantine/core";
import Image from "next/image";
import logoAplikasi from "../../../public/main-logo-white.png";
import iconPlus from "../../assets/icons/ic_plus.svg";
import iconSchedule from "../../assets/icons/ic_schedule.svg";
import { useBoolean, useZustandStore } from "@/hooks";
import ModalCreateAgenda from "./ModalCreateAgenda";
import ModalCreateEvent from "./ModalCreateEvent";

export const HeaderDashboard = () => {
  const theme = useMantineTheme();

  const { detailUser } = useZustandStore();

  const isOpenCreateAgenda = useBoolean();

  const isOpenCreateEvent = useBoolean();

  const isAdmin = detailUser?.roleUser?.isAdmin;

  const accessCreateAgenda = detailUser?.roleUser?.access?.find(
    (item) => item.name === "Create Loan Room",
  );

  const accessCreateEvent = detailUser?.roleUser?.access?.find(
    (item) => item.name === "Create Event",
  );

  return (
    <>
      <AppShell.Header
        style={{
          width: "100%",
          position: "sticky",
          top: 0,
          zIndex: 3,
          height: "230px",
          border: "none",
        }}>
        <Flex
          align={"center"}
          direction={"column"}
          w={"100%"}
          h={"175px"}
          maw={"768px"}
          bg={theme.colors.default[9]}
          style={{
            borderRadius: "0px 0px 100px 100px",
            marginInline: "auto",
          }}>
          <Flex
            w={"100%"}
            px={"28px"}
            mt={"10px"}
            direction={"column"}
            align={"center"}
            gap={15}
            // bg={"blue"}
          >
            <Flex w={"100%"} justify={"space-between"} px={6}>
              <Image
                loading="lazy"
                src={logoAplikasi}
                alt="Logo-Aplikasi"
                height={50}
                width={50}
              />

              {/* <DropdownMenuComponent
                button={
                  <ActionIcon
                    size={35}
                    radius="xl"
                    variant="default"
                    pos={"relative"}
                    bd={"none"}
                    bg={"transparent"}>
                    <IconBellFilled
                      color="white"
                      style={{ width: "75%", height: "65%" }}
                      stroke={1.5}
                    />

                    <Badge
                      size="7px"
                      color="red"
                      circle
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 8,
                      }}></Badge>
                  </ActionIcon>
                }
                position="bottom-end"
                width={170}
              /> */}
            </Flex>

            <Flex w={"100%"} direction={"column"} gap={3} px={6}>
              <Text size="12px" fw={600} c={"white"}>
                Welcome,
              </Text>
              <Text size="14px" fw={400} c={"#ffffffbf"}>
                {detailUser?.jemaat?.name ?? ""}
              </Text>
            </Flex>

            {isAdmin || accessCreateAgenda || accessCreateEvent ? (
              <Flex
                w={320}
                h={100}
                // bg={"white"}
                mt={5}
                pt={0}
                pb={15}
                px={15}
                justify={"center"}
                style={{
                  // backgroundColor: "red",
                  boxShadow: "0px 10px 17px 0px rgba(0, 0, 0, 0.2)",
                  borderRadius: 12,
                  gap: 20,
                }}>
                {isAdmin || accessCreateAgenda ? (
                  <Box
                    bg="white"
                    h={"100%"}
                    w={125}
                    style={{
                      borderRadius: 12,
                      display: "flex",
                      justifyContent: "center",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 10,
                      boxShadow: "inset 0 0 0 1.5px #F3F4F6",
                    }}>
                    <ActionIcon
                      radius={7}
                      size={30}
                      variant="filled"
                      aria-label="Tambah Agenda"
                      color="#E5E7EB"
                      onClick={isOpenCreateAgenda.onTrue}>
                      <Image
                        src={iconPlus}
                        alt="ic_plus"
                        height={10}
                        width={10}
                      />
                    </ActionIcon>

                    <Flex
                      w={"100%"}
                      direction={"column"}
                      gap={3}
                      align={"center"}>
                      <Text size="10px" fw={600} c={theme.colors.default[9]}>
                        Tambah Agenda
                      </Text>
                      <Text size="10px" fw={400} c={"#6B7280"}>
                        Jadwalkan ruangan
                      </Text>
                    </Flex>
                  </Box>
                ) : null}

                {isAdmin || accessCreateEvent ? (
                  <Box
                    bg="white"
                    h={"100%"}
                    w={125}
                    style={{
                      borderRadius: 12,
                      display: "flex",
                      justifyContent: "center",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 10,
                      boxShadow: "inset 0 0 0 1.5px #F3F4F6",
                    }}>
                    <ActionIcon
                      radius={7}
                      size={30}
                      variant="filled"
                      aria-label="Tambah Jadwal"
                      color="#E5E7EB"
                      onClick={isOpenCreateEvent.onTrue}>
                      <Image
                        src={iconSchedule}
                        alt="ic_schedule"
                        height={10}
                        width={10}
                      />
                    </ActionIcon>

                    <Flex
                      w={"100%"}
                      direction={"column"}
                      gap={3}
                      align={"center"}>
                      <Text size="10px" fw={600} c={theme.colors.default[9]}>
                        Tambah Event
                      </Text>
                      <Text size="10px" fw={400} c={"#6B7280"}>
                        Jadwalkan kegiatan
                      </Text>
                    </Flex>
                  </Box>
                ) : null}
              </Flex>
            ) : null}
          </Flex>
        </Flex>
      </AppShell.Header>

      <ModalCreateAgenda isOpenModal={isOpenCreateAgenda} />

      <ModalCreateEvent isOpenModal={isOpenCreateEvent} />
    </>
  );
};
