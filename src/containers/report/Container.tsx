import Image from "next/image";
import { SubMenuComponent } from "@/components";

import iconReport from "../../assets/icons/ic_sub_report.svg";

const listMenu = [
  {
    label: "Jemaat",
    description: "Kelola report jemaat",
    href: "/report/report-jemaat",
    icon: <Image src={iconReport} alt="iconReport" height={35} width={46} />,
    access: "Open Menu Report Jemaat",
  },
];

const Container = () => {
  return <SubMenuComponent listMenu={listMenu} />;
};
export default Container;
