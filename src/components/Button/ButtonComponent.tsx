import {
  Button,
  ButtonVariant,
  MantineColor,
  MantineRadius,
  MantineSize,
  useMantineTheme,
} from "@mantine/core";
import { ReactElement } from "react";

interface PropTypes {
  name: string;
  onClick: () => void;
  icon?: ReactElement;
  color?: MantineColor;
  variant?: ButtonVariant;
  disabled?: boolean;
  radius?: MantineRadius | number;
  fullWidth?: boolean;
  size?: MantineSize | string;
}

export const ButtonComponent = (props: PropTypes) => {
  const theme = useMantineTheme();

  const {
    name,
    onClick,
    icon,
    color = theme.colors.default[9],
    size = "xs",
    variant,
    radius = "md",
    disabled = false,
    fullWidth = true,
  } = props;

  return (
    <Button
      fullWidth={fullWidth}
      variant={variant}
      size={size}
      radius={radius}
      leftSection={icon}
      color={color}
      onClick={onClick}
      disabled={disabled}
      styles={{
        root: {
          minHeight: 32,
          height: 32,
        },
      }}>
      {name}
    </Button>
  );
};
