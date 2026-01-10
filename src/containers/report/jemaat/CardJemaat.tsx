import { Avatar, Flex, Paper, Text, useMantineTheme } from "@mantine/core";
import { IconUsersGroup } from "@tabler/icons-react";

interface PropTypes {
  name: string;
  countMan: number;
  countWoman: number;
}

const CardJemaat = (props: PropTypes) => {
  const { name, countMan, countWoman } = props;

  const theme = useMantineTheme();

  const bgColor =
    name === "Anggota"
      ? theme.colors.secondary[1]
      : name === "Simpatisan"
      ? theme.colors.warning[1]
      : name === "Anak"
      ? theme.colors.primary[1]
      : theme.colors.success[1];

  const icColor =
    name === "Anggota"
      ? theme.colors.secondary[9]
      : name === "Simpatisan"
      ? theme.colors.warning[9]
      : name === "Anak"
      ? theme.colors.primary[9]
      : theme.colors.success[9];

  return (
    <Paper shadow="sm" radius="md" p="xs" withBorder bg={bgColor}>
      <Flex direction={"column"} gap="sm">
        <Flex justify={"space-between"}>
          <Flex direction={"column"} align={"start"} gap={0}>
            <Text size="sm" fw={300}>
              {name}
            </Text>
            <Text size="lg" fw={600}>
              {countMan + countWoman}
            </Text>
          </Flex>

          <Avatar size="sm" radius="md" color={icColor} autoContrast>
            <IconUsersGroup
              style={{ width: "70%", height: "70%" }}
              stroke={1.5}
            />
          </Avatar>
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
    </Paper>
  );
};

export default CardJemaat;
