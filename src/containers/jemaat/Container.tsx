import Image from "next/image";
import { SubMenuComponent } from "@/components";

import iconJemaat from "../../assets/icons/ic_jemaat2.svg";
import iconRoleJemaat from "../../assets/icons/ic_role_user.svg";
import iconBapel from "../../assets/icons/ic_bapel.svg";

const listMenu = [
  {
    label: "Daftar Jemaat",
    description: "Kelola daftar jemaat",
    href: "/jemaat/daftar-jemaat",
    icon: <Image src={iconJemaat} alt="iconJemaat" height={35} width={46} />,
    access: "Open Menu Daftar Jemaat",
  },
  {
    label: "Role Jemaat",
    description: "Kelola peran jemaat",
    href: "/jemaat/role-jemaat",
    icon: (
      <Image src={iconRoleJemaat} alt="iconRoleJemaat" height={35} width={46} />
    ),
    access: "Open Menu Role Jemaat",
  },
  {
    label: "Badan Pelayanan",
    description: "Kelola badan pelayanan",
    href: "/jemaat/bapel",
    icon: <Image src={iconBapel} alt="iconBapel" height={35} width={46} />,
    access: "Open Menu Badan Pelayanan",
  },
];

const Container = () => {
  return <SubMenuComponent listMenu={listMenu} />;
};
export default Container;
