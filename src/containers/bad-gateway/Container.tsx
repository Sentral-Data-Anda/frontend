"use client";

import { Button, useMantineTheme } from "@mantine/core";
import Picture from "../../assets/picture/502.svg";
import Image from "next/image";
import { useRouter } from "next/navigation";

const Container = () => {
  const theme = useMantineTheme();

  const router = useRouter();

  const handleBack = () => {
    router.push("/dashboard");
  };
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFFF",
        overflow: "hidden",
      }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}>
        <Image src={Picture} alt="502" width={250} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "1rem",
          }}>
          <h3
            style={{
              textAlign: "center",
              padding: "0",
              margin: "0",
            }}>
            Terjadi kesalahan pada server.<br></br>Mohon coba lagi nanti.
          </h3>
        </div>
        <Button
          variant="light"
          size="xs"
          radius="md"
          onClick={handleBack}
          color={theme.colors.default[9]}
          style={{
            padding: "0.2rem",
            width: "150px",
            borderRadius: 5,
            border: "none",
            textAlign: "center",
            textDecoration: "none",
          }}
          styles={{
            root: {
              minHeight: 32,
              height: 32,
            },
          }}>
          Muat Ulang
        </Button>
      </div>
    </div>
  );
};
export default Container;
