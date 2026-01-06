"use client";

import {
  ActionIcon,
  AppShell,
  Avatar,
  Flex,
  Group,
  Text,
  useMantineTheme,
} from "@mantine/core";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { getPageTitle } from "@/utils/general";
import iconArrow from "../../assets/icons/ic_arrow.svg";
import { HeaderDashboard } from "./HeaderDashboard";

import iconBeranda from "../../assets/icons/ic_beranda.svg";
import iconRenugan from "../../assets/icons/ic_renungan.svg";
import iconAgenda from "../../assets/icons/ic_agenda.svg";
import { useZustandStore } from "@/hooks";
import { useEffect } from "react";
import { customNotification } from "@/utils";

interface PropTypes {
  children: React.ReactNode;
}

export const Layout = (props: PropTypes) => {
  const { children } = props;

  const theme = useMantineTheme();

  const router = useRouter();

  const pathname = usePathname();

  const { detailUser } = useZustandStore();

  useEffect(() => {
    if (!detailUser) {
      const currentPath = window.location.pathname;
      router.replace(
        `/authentication?redirect=${encodeURIComponent(currentPath)}`,
      );
    }
  }, [detailUser]);

  return (
    <AppShell
      styles={{
        root: {
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          maxWidth: "1024px",
          marginInline: "auto",
        },
        header: {
          marginInline: "auto",
          maxWidth: "1024px",
        },
        footer: {
          marginInline: "auto",
          maxWidth: "1024px",
          width: "100%",
          // display: "flex",
          justifyContent: "center",
        },
        main: {
          width: "100%",
          height: "100%",
          // backgroundColor: "#F4F6",
          backgroundColor: "#FFF",
          padding: "1rem",
          minHeight: "100%",
          flex: 1,
          marginBottom: "3.5rem",
        },
      }}>
      {/* HEADER */}

      {!pathname.includes("dashboard") ? (
        <AppShell.Header
          style={{
            position: "sticky",
            border: "none",
            width: "100%",
          }}>
          <Flex
            w={"100%"}
            h={50}
            bg={theme.colors.default[9]}
            px={27}
            py={11}
            align={"center"}
            pos={"relative"}
            justify={"center"}>
            <ActionIcon
              size={30}
              variant="transparent"
              color="rgba(0, 0, 0, 1)"
              aria-label="Back Navigation"
              onClick={() => router.back()}
              style={{
                position: "absolute",
                left: 27,
              }}>
              <Image src={iconArrow} alt="ic_arrow" height={17} width={15} />
            </ActionIcon>

            <Text
              size="md"
              ta={"center"}
              fw={600}
              tt={"capitalize"}
              c={"white"}>
              {getPageTitle(pathname) ?? ""}
            </Text>
          </Flex>
        </AppShell.Header>
      ) : (
        <HeaderDashboard />
      )}

      {/* MAIN */}
      <AppShell.Main>{children}</AppShell.Main>

      {/* FOOTER */}
      <AppShell.Footer pt={5} pb={10} px={0}>
        <Group justify="space-around" maw={"768px"} w={"100%"}>
          <Flex
            direction={"column"}
            gap={0}
            align={"center"}
            opacity={pathname.includes("dashboard") ? 1 : 0.5}>
            <ActionIcon
              variant={"subtle"}
              aria-label="Beranda"
              size={30}
              onClick={() => router.push("/dashboard")}>
              <Image
                src={iconBeranda}
                alt="ic_beranda"
                height={15}
                width={15}
              />
            </ActionIcon>
            <Text size="12px" ta={"center"}>
              Beranda
            </Text>
          </Flex>

          <Flex
            direction={"column"}
            gap={0}
            align={"center"}
            opacity={pathname.includes("renungan") ? 1 : 0.5}>
            <ActionIcon
              variant="subtle"
              aria-label="Renungan"
              size={30}
              // onClick={() => router.push("/renungan")}>
              onClick={() => {
                customNotification({
                  type: "Warning",
                  text: "Fitur ini sedang tahap Pengembangan !",
                });
              }}>
              <Image
                src={iconRenugan}
                alt="ic_renungan"
                height={15}
                width={15}
              />
            </ActionIcon>
            <Text size="12px" ta={"center"}>
              Renungan
            </Text>
          </Flex>

          <Flex
            direction={"column"}
            gap={0}
            align={"center"}
            opacity={pathname.includes("agenda") ? 1 : 0.5}>
            <ActionIcon
              variant="subtle"
              aria-label="Agenda"
              size={30}
              onClick={() => router.push("/agenda")}>
              <Image src={iconAgenda} alt="ic_agenda" height={15} width={15} />
            </ActionIcon>
            <Text size="12px" ta={"center"}>
              Agenda
            </Text>
          </Flex>

          <Flex
            direction={"column"}
            gap={0}
            align={"center"}
            opacity={pathname.includes("/user/edit") ? 1 : 0.5}>
            <ActionIcon
              variant="subtle"
              aria-label="Profile"
              size={30}
              onClick={() => router.push(`/user`)}>
              <Avatar
                name={detailUser?.jemaat?.name}
                bg={"white"}
                color={detailUser?.jemaat?.gender === "L" ? "blue" : "red"}
                size={25}
              />
            </ActionIcon>
            <Text size="12px" ta={"center"}>
              Profile
            </Text>
          </Flex>
        </Group>
      </AppShell.Footer>
    </AppShell>
  );
};
