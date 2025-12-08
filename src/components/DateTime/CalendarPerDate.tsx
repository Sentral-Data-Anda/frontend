import { ActionIcon, Flex, Text, useMantineTheme } from "@mantine/core";
import dayjs from "dayjs";

interface PropTypes {
  day: dayjs.Dayjs;
  isSelected: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isCurrentMonth?: boolean;
  onSelect: (day: dayjs.Dayjs) => void;
  customOnSelect?: (day: dayjs.Dayjs) => void;
}

export const CalendarPerDate = ({
  day,
  isSelected,
  isToday,
  isWeekend,
  isCurrentMonth = false,
  onSelect,
  customOnSelect,
}: PropTypes) => {
  const theme = useMantineTheme();

  let variant: "filled" | "outline" | "light" = "light";
  let color: string = "gray";

  if (isSelected) {
    variant = "filled";
    color = theme.colors.default[2];
  } else if (isToday) {
    variant = "outline";
    color = theme.colors.default[7];
  } else if (isWeekend) {
    color = "red";
  }

  return (
    <ActionIcon
      size={45}
      radius="md"
      variant={variant}
      color={color}
      disabled={!isCurrentMonth}
      opacity={!isCurrentMonth ? 0.4 : 1}
      onClick={() => {
        if (isCurrentMonth) onSelect(day);

        if (customOnSelect) {
          customOnSelect(day);
        }
      }}>
      <Flex direction="column" gap={3}>
        <Text
          size="10px"
          ta="center"
          c={!isCurrentMonth ? "dimmed" : isWeekend ? "red" : "black"}>
          {day.format("ddd")}
        </Text>
        <Text
          size="xs"
          fw={700}
          ta="center"
          c={!isCurrentMonth ? "dimmed" : isWeekend ? "red" : "black"}>
          {day.format("D")}
        </Text>
      </Flex>
    </ActionIcon>
  );
};
