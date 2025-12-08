import { Box } from "@mantine/core";
import { ModalComponent } from "./Modal";

interface Props {
  isOpenModal: boolean;
  titleModal: string;
  pdfUrl: string | undefined;
  onClose: () => void;
}

export const ModalViewPdf = (props: Props) => {
  const { isOpenModal, titleModal, pdfUrl, onClose } = props;

  return (
    <ModalComponent
      opened={isOpenModal}
      loading={false}
      title={titleModal}
      close={onClose}>
      <Box w={"100%"} h={"90vh"}>
        <embed
          src={pdfUrl}
          type="application/pdf"
          width="100%"
          height={"100%"}
        />
      </Box>
    </ModalComponent>
  );
};
