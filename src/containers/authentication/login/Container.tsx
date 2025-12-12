"use client";

import { Box, Stack, Text, useMantineTheme } from "@mantine/core";
import Image from "next/image";
import dynamic from "next/dynamic";

const FormLogin = dynamic(() => import("./FormLogin"), {
  ssr: false,
});

const Container = () => {
  const theme = useMantineTheme();

  return (
    <Box
      style={{
        marginInline: "auto",
        maxWidth: "1024px",
      }}>
      <Box
        style={{
          height: "100vh",
          background: theme.colors.default[9],
          maxWidth: "100%",
          display: "flex",
          alignItems: "end",
          width: "100%",
          position: "sticky",
          top: 0,
        }}>
        <Box
          w={"100%"}
          h={"90%"}
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
            gap: 15,
          }}>
          <Image
            fetchPriority="high"
            src="/main-logo-white.png"
            alt="Logo-pp"
            width={200}
            height={200}
          />
          <Box
            w={"100%"}
            h={"68%"}
            pt={32}
            px={35}
            style={{
              backgroundColor: "white",
              borderTopLeftRadius: 80,
              display: "flex",
              flexDirection: "column",
              rowGap: 15,
            }}>
            <Stack gap={40} align="center">
              <Stack gap={5}>
                <Text size="sm" p={0} c="black" opacity={"50%"} ta={"center"}>
                  Glad to see you again
                </Text>
                <Text size="sm" p={0} c="black" opacity={"50%"} ta={"center"}>
                  Login to your account below
                </Text>
              </Stack>
              <FormLogin />
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Container;
