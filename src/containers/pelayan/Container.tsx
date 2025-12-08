import Image from "next/image";
import { SubMenuComponent } from "@/components";

import iconJadwal from "../../assets/icons/ic_jadwal_pelayan.svg";
import iconPelayan from "../../assets/icons/ic_list_pelayan.svg";
import iconRoleUser from "../../assets/icons/ic_role_user.svg";
import iconTemplate from "../../assets/icons/ic_template.svg";

const listMenu = [
  {
    label: "Jadwal Pelayan",
    description: "Kelola jadwal pelayan",
    href: "/pelayan/jadwal-pelayan",
    icon: <Image src={iconJadwal} alt="iconJadwal" height={35} width={46} />,
    access: "Open Menu Jadwal Pelayan",
  },
  {
    label: "Daftar Pelayan",
    description: "Kelola daftar pelayan",
    href: "/pelayan/daftar-pelayan",
    icon: <Image src={iconPelayan} alt="iconPelayan" height={35} width={46} />,
    access: "Open Menu Daftar Pelayan",
  },
  {
    label: "Role Pelayan",
    description: "Kelola peran pelayan",
    href: "/pelayan/role-pelayan",
    icon: (
      <Image src={iconRoleUser} alt="iconRoleUser" height={35} width={46} />
    ),
    access: "Open Menu Role Pelayan",
  },
  {
    label: "Template Jadwal",
    description: "Kelola template jadwal",
    href: "/pelayan/template-pelayan",
    icon: (
      <Image src={iconTemplate} alt="iconTemplate" height={35} width={46} />
    ),
    access: "Open Menu Template Pelayan",
  },
];

const Container = () => {
  return <SubMenuComponent listMenu={listMenu} />;
};
export default Container;
