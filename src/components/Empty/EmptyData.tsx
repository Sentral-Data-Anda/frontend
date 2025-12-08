import { Stack, Text } from "@mantine/core";
import Image from "next/image";
import Empty from "../../assets/picture/empty.png";

export const EmptyData = () => {
  return (
    <Stack
      w={"100%"}
      h={"calc(100vh - 35vh)"}
      justify="center"
      align="center"
      style={{
        opacity: 0.15,
        WebkitFilter: "grayscale(100%)" /* Safari 6.0 - 9.0 */,
        filter: "grayscale(100%)",
      }}>
      <Image loading="lazy" src={Empty} alt="empty" width={90} />
      <Text size="xl">Empty Data</Text>
    </Stack>
  );
};
