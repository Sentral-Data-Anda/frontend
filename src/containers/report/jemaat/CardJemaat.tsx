import { Avatar, Flex, Text } from "@mantine/core";
import { IconUsersGroup } from "@tabler/icons-react";

interface PropTypes {
  name: string;
  color: string;
  countMan: number;
  countWoman: number;
}

const CardJemaat = (props: PropTypes) => {
  const { name, color, countMan, countWoman } = props;

  return (
    <>
      <Flex direction={"column"} gap="sm">
        <Flex direction={"column"} align={"center"} gap="xs">
          <Avatar size="sm" color={color} radius="xl">
            <IconUsersGroup
              style={{ width: "70%", height: "70%" }}
              stroke={1.5}
            />
          </Avatar>
          <Text size="sm">{name}</Text>
        </Flex>

        <Flex direction={"column"}>
          <Flex justify={"space-between"}>
            <Text size="xs">Laki-laki</Text>
            <Text size="xs">{countMan}</Text>
          </Flex>
          <Flex justify={"space-between"}>
            <Text size="xs">Perempuan</Text>
            <Text size="xs">{countWoman}</Text>
          </Flex>
        </Flex>
      </Flex>
    </>
  );
};

export default CardJemaat;
