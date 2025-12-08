import {
  Badge,
  BadgeVariant,
  MantineColor,
  MantineRadius,
  MantineSize,
} from "@mantine/core";

interface PropTypes {
  variant?: BadgeVariant;
  size: string | MantineSize;
  radius: MantineRadius | number;
  color: MantineColor;
  text: string | number;
}

export const BadgeComponent = (props: PropTypes) => {
  const { size, variant = "dot", radius, color, text } = props;

  return (
    <Badge variant={variant} size={size} color={color} radius={radius}>
      {text}
    </Badge>
  );
};
