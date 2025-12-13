import {
  ActionIcon,
  Flex,
  LoadingOverlay,
  Modal,
  ScrollArea,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { ReactElement } from "react";
import { IconEdit } from "@tabler/icons-react";
import { useBoolean } from "@/hooks";
import Image from "next/image";
import gitLogo from "../../assets/gif/logo.gif";

interface PropTypes {
  opened: boolean;
  close: () => void;
  title: string;
  children: ReactElement;
  loading?: boolean;
  withCloseButton?: boolean;
  withEditButton?: boolean;
  isEditing?: ReturnType<typeof useBoolean>;
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
      withOverlay={false}
      opened={opened}
      onClose={close}
      title={customTitle}
      centered
      fullScreen
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
          minHeight: "calc(100vh - 50px)",
          height: "calc(100vh - 50px)",
        },
      }}>
      <LoadingOverlay
        visible={loading}
        transitionProps={{
          duration: 500,
          transition: "fade",
        }}
        overlayProps={{ blur: 2, bg: theme.colors.default[5] }}
        loaderProps={{
          children: (
            <Flex
              style={{
                height: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}>
              {/* <div className="loader"></div> */}
              <Image
                fetchPriority="high"
                src={gitLogo}
                alt="Logo-pp"
                width={200}
                height={200}
              />
            </Flex>
          ),
        }}
      />

      {children}
    </Modal>
  );
};
