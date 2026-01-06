import {
  ActionIcon,
  Flex,
  LoadingOverlay,
  MantineSize,
  Modal,
  ScrollArea,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { ReactElement } from "react";
import { IconEdit } from "@tabler/icons-react";
import { useBoolean } from "@/hooks";
import { LoadingGlobalComponent } from "../Loading";

interface PropTypes {
  opened: boolean;
  close: () => void;
  title: string;
  children: ReactElement;
  loading?: boolean;
  withCloseButton?: boolean;
  withEditButton?: boolean;
  isEditing?: ReturnType<typeof useBoolean>;
  size?: MantineSize;
  minHeight?: string;
}

export const ModalComponent = (props: PropTypes) => {
  const {
    opened,
    close,
    title,
    children,
    loading = false,
    withCloseButton = true,
    withEditButton = false,
    isEditing,
    size,
    minHeight = "calc(100vh - 50px)",
  } = props;

  const theme = useMantineTheme();

  const customTitle = (
    <Flex align={"center"} gap="xs">
      <Text size="md">{title}</Text>

      {withEditButton ? (
        <ActionIcon
          size={24}
          color={theme.colors.default[9]}
          variant="light"
          aria-label="Edit"
          disabled={isEditing?.value}
          onClick={isEditing?.onTrue ?? (() => {})}>
          <IconEdit style={{ width: "60%", height: "60%" }} stroke={1.5} />
        </ActionIcon>
      ) : null}
    </Flex>
  );

  return (
    <Modal
      scrollAreaComponent={ScrollArea.Autosize}
      // keepMounted={false}
      withCloseButton={withCloseButton}
      withOverlay
      opened={opened}
      onClose={close}
      title={customTitle}
      centered
      fullScreen={!size}
      size={size}
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
      styles={{
        root: {
          zIndex: 999,
        },
        title: {
          fontSize: "16px",
        },
        header: {
          paddingBlock: 10,
          height: 50,
          minHeight: 50,
          // position: "absolute",
        },
        body: {
          minHeight: minHeight,
          // height: "calc(100vh - 50px)",
        },
      }}>
      <LoadingOverlay
        visible={loading}
        transitionProps={{
          duration: 500,
          transition: "fade",
        }}
        overlayProps={{ blur: 2, bg: theme.colors.default[7] }}
        loaderProps={{
          children: <LoadingGlobalComponent />,
        }}
      />

      {children}
    </Modal>
  );
};
