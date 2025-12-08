import { Button, useMantineTheme } from "@mantine/core";
import { IconDeviceFloppy } from "@tabler/icons-react";

interface PropTypes {
  name: string;
  loading?: boolean;
  onClick?: () => void;
}

export const ButtonSubmitComponent = (props: PropTypes) => {
  const { name, loading, onClick } = props;

  const theme = useMantineTheme();

  return (
    <Button
      size="xs"
      radius="md"
      styles={{
        section: {
          margin: 3,
        },
        root: {
          minHeight: 32,
          height: 32,
        },
      }}
      leftSection={
        name === "Save" || name === "Update" ? (
          <IconDeviceFloppy size={18} stroke={1.5} />
        ) : (
          false
        )
      }
      c={theme.white}
      bg={theme.colors.default[9]}
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      fullWidth
      loading={loading}
      loaderProps={{ type: "dots" }}>
      {name}
    </Button>
  );
};
