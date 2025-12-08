import { Image, Stack } from "@mantine/core";
import { ModalComponent } from "./Modal";
import { useBoolean } from "@/hooks";

interface Props {
  isOpenModal: ReturnType<typeof useBoolean>;
  titleModal: string;
  listImage: string[];
}

export const ModalViewImage = (props: Props) => {
  const { isOpenModal, titleModal, listImage } = props;

  const urlImage = process.env.NEXT_PUBLIC_FILE_URL;

  return (
    <ModalComponent
      opened={isOpenModal.value}
      loading={false}
      title={titleModal}
      close={isOpenModal.onFalse}>
      <Stack align="stretch" justify="center" gap="xs">
        {listImage && listImage.length > 0
          ? listImage.map((image, index) => {
              return (
                <Image
                  key={index}
                  src={`${urlImage}/${image}`}
                  alt={`view-image-${index}`}
                  fallbackSrc="https://placehold.co/1280x720?text=Loading"
                />
              );
            })
          : null}
      </Stack>
    </ModalComponent>
  );
};
