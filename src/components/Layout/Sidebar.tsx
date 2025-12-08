"use client";

import { Role } from "@/types";
import { NavLink, Stack, useMantineTheme } from "@mantine/core";

import {
  IconLayoutDashboard,
  IconDatabaseCog,
  IconUsersGroup,
  IconCalendarEvent,
  IconActivity,
  IconCalendarStats,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactElement, useEffect, useState } from "react";

interface PropTypes {
  openSidebar: boolean;
  handleOpen?: () => void;
  handleClose: () => void;
  role?: Role;
}

interface ChildMenu {
  name: string;
  link: string;
  access: string;
}

interface ListMenu {
  name: string;
  icon: ReactElement;
  link?: string;
  access?: string;
  child?: ChildMenu[];
}

const listMenu: ListMenu[] = [
  {
    name: "Dashboard",
    icon: <IconLayoutDashboard size={20} stroke={1} />,
    link: "/dashboard",
    access: "Open Menu Dashboard",
  },
  {
    name: "Schedule",
    icon: <IconCalendarStats size={20} stroke={1} />,
    child: [
      {
        name: "Ruangan",
        link: "/schedule/ruangan",
        access: "Open Menu Ruangan",
      },
    ],
  },
  {
    name: "Asset Management",
    icon: <IconDatabaseCog size={20} stroke={1} />,
    child: [
      {
        name: "Dokumen",
        link: "/asset-management/document",
        access: "Open Menu Dokumen",
      },
      {
        name: "Ruangan",
        link: "/asset-management/ruangan",
        access: "Open Menu Ruangan",
      },
      {
        name: "Barang",
        link: "/asset-management/barang",
        access: "Open Menu Barang",
      },
    ],
  },
  {
    name: "Events & Gallery ",
    icon: <IconCalendarEvent size={20} stroke={1} />,
    child: [
      {
        name: "Events",
        link: "/events-gallery/events",
        access: "Open Menu Events",
      },
      {
        name: "Gallery",
        link: "/events-gallery/gallery",
        access: "Open Menu Gallery",
      },
    ],
  },
  {
    name: "User Management",
    icon: <IconUsersGroup size={20} stroke={1} />,
    child: [
      {
        name: "Komisi",
        link: "/user-management/komisi",
        access: "Open Menu Komisi",
      },
      {
        name: "User",
        link: "/user-management/user",
        access: "Open Menu User",
      },
    ],
  },
  {
    name: "Activity Logs",
    icon: <IconActivity size={20} stroke={1} />,
    link: "/activity-logs",
    access: "Open Menu Activity Logs",
  },
];

export const Sidebar = (props: PropTypes) => {
  const { openSidebar, handleOpen, handleClose, role } = props;

  const pathname = usePathname();

  const theme = useMantineTheme();

  const [accessRightMenu, setAccessRightMenu] = useState<ListMenu[]>([]);

  const [activeMenu, setActiveMenu] = useState("");

  const handleNestedMenu = (value: ListMenu) => {
    if (openSidebar) {
      if (activeMenu === value.name) {
        setActiveMenu("");
      } else {
        setActiveMenu(value.name);
      }
    } else {
      handleOpen?.();
      setTimeout(() => {
        setActiveMenu(value.name);
      }, 175);
    }
  };

  function menuIncludePath(value: ListMenu) {
    const path = pathname;

    return value.child?.some((child) => child.link === path);
  }

  useEffect(() => {
    if (!openSidebar) {
      setTimeout(() => {
        setActiveMenu("");
      }, 150);
    }
  }, [openSidebar]);

  useEffect(() => {
    if (role?.isAdmin) {
      setAccessRightMenu(listMenu);
    } else {
      const accessNames = role?.access.map((a) => a.name);

      const filteredMenu = listMenu
        .map((menu) => {
          if (!menu.child) {
            return accessNames?.includes(menu.access ?? "") ? menu : null;
          } else {
            const filteredChild = menu.child.filter((child) =>
              accessNames?.includes(child.access ?? ""),
            );

            return filteredChild.length > 0
              ? { ...menu, child: filteredChild }
              : null;
          }
        })
        .filter(Boolean) as ListMenu[];

      setAccessRightMenu(filteredMenu);
    }
  }, [role]);

  return (
    // LIST MENU
    <Stack justify="start" gap="7px">
      {accessRightMenu.map((value, index) => {
        if (value.child && value.child.length > 0) {
          return (
            <NavLink
              key={index}
              label={openSidebar ? value.name : ""}
              styles={{
                label: {
                  fontSize: "14px",
                  textWrap: "nowrap",
                },
              }}
              leftSection={value.icon}
              variant="filled"
              onClick={() => handleNestedMenu(value)}
              color={theme.colors.default[9]}
              active={value.name !== activeMenu && menuIncludePath(value)}
              opened={value.name === activeMenu}
              style={{
                borderRadius: 5,
              }}>
              {openSidebar
                ? value.child.map((valueChild, indexChild) => (
                    <NavLink
                      key={indexChild}
                      label={valueChild.name}
                      active={pathname === valueChild.link}
                      component={Link}
                      href={valueChild.link}
                      variant="filled"
                      color={theme.colors.default[9]}
                      style={{
                        borderRadius: 5,
                      }}
                      styles={{
                        label: {
                          fontSize: "14px",
                        },
                      }}
                      onClick={() => {
                        setTimeout(() => {
                          handleClose();
                        }, 500);
                      }}
                    />
                  ))
                : null}
            </NavLink>
          );
        }

        return (
          <NavLink
            key={index}
            label={openSidebar ? value.name : ""}
            styles={{
              label: {
                fontSize: "14px",
              },
            }}
            leftSection={value.icon}
            active={pathname === value.link}
            variant="filled"
            color={theme.colors.default[9]}
            style={{
              borderRadius: 5,
            }}
            onClick={() => {
              setTimeout(() => {
                handleClose();
              }, 500);
            }}
            component={Link}
            href={value.link ?? ""}
          />
        );
      })}
    </Stack>
  );
};
