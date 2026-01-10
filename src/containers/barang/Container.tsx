import Image from "next/image";
import { SubMenuComponent } from "@/components";

import iconBarang from "../../assets/icons/ic_sub_barang.svg";
import iconTypeBarang from "../../assets/icons/ic_type_item.svg";

const listMenu = [
  {
    label: "Daftar Barang",
    description: "Kelola daftar barang",
    href: "/barang/daftar-barang",
    icon: <Image src={iconBarang} alt="iconBarang" height={35} width={46} />,
    access: "Open Menu Daftar Barang",
  },
  {
    label: "Tipe Barang",
    description: "Kelola tipe barang",
    href: "/barang/tipe-barang",
    icon: (
      <Image src={iconTypeBarang} alt="iconTypeBarang" height={35} width={46} />
    ),
    access: "Open Menu Tipe Barang",
  },
];

const Container = () => {
  return <SubMenuComponent listMenu={listMenu} />;
};
export default Container;
