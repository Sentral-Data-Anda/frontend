"use client";

import Image from "next/image";
import { SubMenuComponent } from "@/components";

import iconUser from "../../assets/icons/ic_user.svg";
import iconRoleUser from "../../assets/icons/ic_role_user.svg";
import iconBapel from "../../assets/icons/ic_bapel.svg";
import iconAccessRight from "../../assets/icons/ic_access_right.svg";
import iconActivityLogs from "../../assets/icons/ic_activity_logs.svg";

const listMenu = [
  {
    label: "User",
    description: "Kelola pengguna",
    href: "/administrator/user",
    icon: <Image src={iconUser} alt="iconUser" height={35} width={46} />,
    access: "Open Menu User",
  },
  {
    label: "Role User",
    description: "Kelola peran pengguna",
    href: "/administrator/role-user",
    icon: (
      <Image src={iconRoleUser} alt="iconRoleUser" height={35} width={46} />
    ),
    access: "Open Menu Role User",
  },
  {
    label: "Badan Pelayanan",
    description: "Kelola badan pelayanan",
    href: "/administrator/bapel",
    icon: <Image src={iconBapel} alt="iconBapel" height={35} width={46} />,
    access: "Open Menu Badan Pelayanan",
  },
  {
    label: "Hak Akses User",
    description: "Kelola izin dan akses pengguna",
    href: "/administrator/access-right",
    icon: (
      <Image
        src={iconAccessRight}
        alt="iconAccessRight"
        height={35}
        width={46}
      />
    ),
    access: "Open Menu Access Right",
  },
  {
    label: "Activity Logs",
    description: "Lihat aktivitas pengguna",
    href: "/administrator/activity-logs",
    icon: (
      <Image
        src={iconActivityLogs}
        alt="iconActivityLogs"
        height={35}
        width={46}
      />
    ),
    access: "Open Menu Activity Log",
  },
];

const Container = () => {
  return <SubMenuComponent listMenu={listMenu} />;
};
export default Container;
