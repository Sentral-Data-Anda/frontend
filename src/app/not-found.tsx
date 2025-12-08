"use client";

import Picture from "../assets/picture/404.jpg";
import Image from "next/image";
import { Button, useMantineTheme } from "@mantine/core";
import { useRouter } from "next/navigation";

export default function NotFoundPage() {
  const theme = useMantineTheme();

  const router = useRouter();

  const handleBack = () => {
    router.back();
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
        <Image src={Picture} alt="404" width={250} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "1rem",
            marginTop: "-4rem",
          }}>
          <h2
            style={{
              textAlign: "center",
              padding: "0",
              margin: "0",
            }}>
            Page Not Found
          </h2>
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
          Kembali
        </Button>
      </div>
    </div>
  );
}
