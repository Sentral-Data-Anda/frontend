import { Box, Flex, Text } from "@mantine/core";
import logoApp from "../../../assets/icons/ic_logo.svg";
import logoText from "../../../assets/icons/ic_text.svg";
import Image from "next/image";
import FormLogin from "./FormLogin";

const Container = () => {
  return (
    <Box
      style={{
        marginInline: "auto",
        maxWidth: "1024px",
      }}>
      <Box
        style={{
          height: "100vh",
          background: "#112B3C",
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
          h={"85%"}
          style={{
            justifyContent: "space-between",
            alignItems: "center",
          }}>
          <Image src={logoApp} alt="Logo-pp" height={80} />
          <Flex
            w={"100%"}
            direction={"column"}
            rowGap={15}
            h={"78%"}
            pt={32}
            px={35}
            style={{
              backgroundColor: "white",
              borderTopLeftRadius: 80,
            }}>
            <Flex direction="column" gap={40} align={"center"}>
              <Flex direction="column" gap={15} align={"center"}>
                <Image src={logoText} alt="Logo-Text" height={25} />
                <Flex direction="column" gap={0}>
                  <Text size="sm" p={0} c="black" opacity={"50%"} ta={"center"}>
                    Glad to see you again
                  </Text>
                  <Text size="sm" p={0} c="black" opacity={"50%"} ta={"center"}>
                    Login to your account below
                  </Text>
                </Flex>
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
