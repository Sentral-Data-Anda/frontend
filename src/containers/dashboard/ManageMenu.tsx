"use client ";

import {
  ActionIcon,
  Flex,
  SimpleGrid,
  Text,
  useMantineTheme,
} from "@mantine/core";
import Image from "next/image";
import { ReactElement } from "react";

import { Swiper, SwiperSlide } from "swiper/react";
import { Grid, Mousewheel, Pagination } from "swiper/modules";
import Link from "next/link";
import { useZustandStore } from "@/hooks";

import "swiper/css";
import "swiper/css/pagination";

import iconRuang from "../../assets/icons/ic_ruang.svg";
import iconBarang from "../../assets/icons/ic_barang.svg";
import iconEvent from "../../assets/icons/ic_event.svg";
import iconGaleri from "../../assets/icons/ic_galeri.svg";
import iconPelayan from "../../assets/icons/ic_pelayan.svg";
import iconJemaat from "../../assets/icons/ic_jemaat.svg";
import iconReport from "../../assets/icons/ic_report.svg";
import iconAdmin from "../../assets/icons/ic_admin.svg";

interface ListMenu {
  name: string;
  icon: ReactElement;
  link: string;
  access: string;
}

export const listMenu: ListMenu[] = [
  {
    name: "Ruang",
    link: "/ruangan",
    access: "Open Menu Room",
    icon: <Image src={iconRuang} alt="ic_ruang" height={15} width={15} />,
  },
  {
    name: "Barang",
    link: "/barang",
    access: "Open Menu Item",
    icon: <Image src={iconBarang} alt="ic_barang" height={15} width={15} />,
  },
  {
    name: "Event",
    link: "/events",
    access: "Open Menu Event",
    icon: <Image src={iconEvent} alt="ic_event" height={15} width={15} />,
  },
  {
    name: "Galeri",
    link: "/gallery",
    access: "Open Menu Gallery",
    icon: <Image src={iconGaleri} alt="ic_galeri" height={15} width={15} />,
  },
  {
    name: "Jemaat",
    link: "/jemaat",
    access: "Open Menu Jemaat",
    icon: <Image src={iconJemaat} alt="ic_jemaat" height={15} width={15} />,
  },
  {
    name: "Pelayan",
    link: "/pelayan",
    access: "Open Menu Pelayan",
    icon: <Image src={iconPelayan} alt="ic_pelayan" height={15} width={15} />,
  },
  {
    name: "Report",
    link: "/report",
    access: "Open Menu Report",
    icon: <Image src={iconReport} alt="ic_report" height={15} width={15} />,
  },
  {
    name: "Admin",
    link: "/administrator",
    access: "Open Menu Administrator",
    icon: <Image src={iconAdmin} alt="ic_admin" height={15} width={15} />,
  },
];

const divideArray = (arr: any[], size: number) => {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

const ManageMenu = () => {
  const theme = useMantineTheme();

  const { detailUser } = useZustandStore();

  const allowedMenu = detailUser?.roleUser?.isAdmin
    ? listMenu
    : listMenu.filter((menu) =>
        detailUser?.roleUser?.access.some(
          (item: any) => item.name === menu.access,
        ),
      );

  const divideMenu = divideArray(allowedMenu, 8);

  return (
    <Flex direction={"column"} gap={15}>
      <Text size="sm" ta={"start"} fw={500}>
        Menu
      </Text>

      {divideMenu.length > 0 ? (
        <Swiper
          spaceBetween={30}
          pagination={{
            clickable: true,
          }}
          mousewheel={true}
          direction={"horizontal"}
          modules={[Grid, Pagination, Mousewheel]}
          centeredSlides={true}
          className="mySwiper"
          style={{
            width: "100%",
            height: "fit-content",
            justifyItems: "center",
          }}>
          {divideMenu.map((value, index) => {
            return (
              <SwiperSlide key={index}>
                <SimpleGrid
                  style={{
                    justifyItems: "center",
                  }}
                  w={"100%"}
                  cols={4}
                  spacing="xs"
                  verticalSpacing="md"
                  h={"auto"}>
                  {value && value.length > 0
                    ? value.map((value: ListMenu, indexMenu: number) => {
                        return (
                          <Flex
                            direction={"column"}
                            gap={3}
                            align={"center"}
                            w={"fit-content"}
                            key={value.name + indexMenu}>
                            <ActionIcon
                              radius={7}
                              size={40}
                              variant="filled"
                              aria-label={value.name}
                              color={theme.colors.default[9]}
                              component={Link}
                              href={value.link}>
                              {value.icon}
                            </ActionIcon>
                            <Text size="xs" ta={"center"}>
                              {value.name}
                            </Text>
                          </Flex>
                        );
                      })
                    : null}
                </SimpleGrid>
              </SwiperSlide>
            );
          })}
        </Swiper>
      ) : null}
    </Flex>
  );
};
export default ManageMenu;
