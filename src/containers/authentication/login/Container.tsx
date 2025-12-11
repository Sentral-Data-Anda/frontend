"use client";

import { Box, Flex, Text, useMantineTheme } from "@mantine/core";
import logoApp from "../../../assets/icons/ic_logo.svg";
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
          position: "relative",
          top: 0,
        }}>
        <Flex
          w={"100%"}
          direction={"column"}
          gap={15}
          h={"90%"}
          style={{
            justifyContent: "space-between",
            alignItems: "center",
          }}>
          <Image src={logoApp} alt="Logo-pp" height={200} />
          <Flex
            w={"100%"}
            direction={"column"}
            rowGap={15}
            h={"68%"}
            pt={32}
            px={35}
            style={{
              backgroundColor: "white",
              borderTopLeftRadius: 80,
            }}>
            <Flex direction="column" gap={40} align={"center"}>
              <Flex direction="column">
                <Text size="sm" p={0} c="black" opacity={"50%"} ta={"center"}>
                  Glad to see you again
                </Text>
                <Text size="sm" p={0} c="black" opacity={"50%"} ta={"center"}>
                  Login to your account below
                </Text>
              </Flex>
              <FormLogin />
            </Flex>
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
};

export default Container;
