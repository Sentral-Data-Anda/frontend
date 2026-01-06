import Image from "next/image";
import logoSadaA from "../../assets/picture/logo_sada_A.png";
import logoSadaD from "../../assets/picture/logo_sada_D.png";
import logoSadaS from "../../assets/picture/logo_sada_S.png";

import style from "./custom.module.css";

export const LoadingGlobalComponent = () => {
  return (
    <div className={style.customLoading}>
      <Image
        fetchPriority="high"
        src={logoSadaS}
        alt="logoSadaS"
        width={200}
        height={200}
        className={style.imageS}
      />
      <Image
        fetchPriority="high"
        src={logoSadaA}
        alt="logoSadaA"
        width={200}
        height={200}
        className={style.imageA}
      />
      <Image
        fetchPriority="high"
        src={logoSadaD}
        alt="logoSadaD"
        width={200}
        height={200}
        className={style.imageD}
      />
    </div>
  );
};
