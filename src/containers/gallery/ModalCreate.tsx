import { useBoolean } from "@/hooks";
import { FormGallery } from "@/types";
import { useState } from "react";
import Form from "./Form";
import { ButtonSubmitComponent, ModalComponent } from "@/components";
import { galleryService } from "@/services";
import { customNotification, extractErrorMessage } from "@/utils";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  handleGetAll: () => void;
}

const ModalCreate = (props: PropTypes) => {
  const { isOpenModal, handleGetAll } = props;

  const isLoading = useBoolean();

  const [formGallery, setFormGallery] = useState<FormGallery>({
    name: "",
    listImage: [undefined],
    bapelId: null,
    isPublish: undefined,
  });

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    isLoading.onTrue();
    try {
      const payload = new FormData();

      payload.append("name", formGallery.name);
      payload.append("bapelId", String(formGallery.bapelId));

      if (formGallery.listImage) {
        formGallery.listImage
          ?.filter((file): file is File => file !== undefined && file !== null)
          .forEach((file) => payload.append("image", file));
      }

      if (formGallery.isPublish) {
        payload.append("isPublish", formGallery.isPublish);
      }

      const response = await galleryService.create(payload);

      if (response && response.status === 201) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            handleGetAll();
            setFormGallery({
              name: "",
              listImage: [],
              bapelId: null,
              isPublish: undefined,
            });
            isOpenModal.onFalse();
            isLoading.onFalse();
          },
        );
      }
    } catch (error: any) {
      customNotification({
        type: typeof error === "string" ? "Warning" : "Error",
        text: extractErrorMessage(error),
      }).then(() => {
        isLoading.onFalse();
      });
    }
  }

  return (
    <ModalComponent
      opened={isOpenModal.value}
      title="Create New Gallery"
      withCloseButton
      close={() => {
        isOpenModal.onFalse();
        setFormGallery({
          name: "",
          listImage: [undefined],
          bapelId: null,
          isPublish: undefined,
        });
      }}>
      <Form
        isDisable={isLoading.value}
        formGallery={formGallery}
        setFormGallery={setFormGallery}
        onSubmit={handleCreate}
        button={
          <ButtonSubmitComponent name={"Save"} loading={isLoading.value} />
        }
      />
    </ModalComponent>
  );
};

export default ModalCreate;
