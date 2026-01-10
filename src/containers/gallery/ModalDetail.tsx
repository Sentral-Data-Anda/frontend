import { useBoolean } from "@/hooks";
import { FormGallery, ImageGallery } from "@/types";
import { useEffect, useState } from "react";
import Form from "./Form";
import { ButtonGroupComponent, ModalComponent } from "@/components";
import { galleryService } from "@/services";
import {
  customNotification,
  extractErrorMessage,
  urlImageToFile,
} from "@/utils";
import Detail from "./Detail";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  codeGallery: string;
  handleGetAll: () => void;
  withEditButton: boolean;
}

const ModalDetail = (props: PropTypes) => {
  const { isOpenModal, codeGallery, handleGetAll, withEditButton } = props;

  const isLoading = useBoolean();

  const isLoadingDetail = useBoolean();

  const isEditing = useBoolean();

  const [dataImages, setDataImages] = useState<string[]>([]);

  const [formGallery, setFormGallery] = useState<FormGallery>({
    name: "",
    listImage: [],
    bapelId: null,
    isPublish: undefined,
  });

  async function handleGetDetail(codeGallery: string) {
    isLoadingDetail.onTrue();

    try {
      const response = await galleryService.getOne(codeGallery);

      let detailImage: File[] = [];

      const listImage: string[] = [];

      if (response.data.listImage && response.data.listImage.length > 0) {
        const detailImageArray = response.data.listImage;

        detailImage = await Promise.all(
          detailImageArray.map((item: ImageGallery) =>
            urlImageToFile(item.path, item.originalName, item.mimeType),
          ),
        );

        detailImageArray?.map((item: any) => {
          listImage.push(item.path);
        });

        setDataImages(listImage);
      }

      setFormGallery({
        name: response.data.name,
        listImage: detailImage,
        bapelId: String(response.data.bapel.id),
        isPublish: response.data.isPublish ? "1" : "0",
      });
    } catch (error: any) {
      customNotification({
        type: typeof error === "string" ? "Warning" : "Error",
        text: error || "Something went wrong",
      });
    } finally {
      isLoadingDetail.onFalse();
    }
  }

  useEffect(() => {
    if (isOpenModal.value) {
      handleGetDetail(codeGallery);
    }
  }, [isOpenModal]);

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
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

      const response = await galleryService.update(codeGallery, payload);

      if (response && response.status === 200) {
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
      loading={isLoadingDetail.value}
      opened={isOpenModal.value}
      title={`${isEditing.value ? "Edit" : "Detail"} Data Gallery`}
      withEditButton={withEditButton}
      isEditing={isEditing}
      close={() => {
        isOpenModal.onFalse();
        isEditing.onFalse();
        setFormGallery({
          name: "",
          listImage: [],
          bapelId: null,
          isPublish: undefined,
        });
      }}>
      {isEditing.value ? (
        <Form
          isDisable={!isEditing.value || isLoading.value}
          formGallery={formGallery}
          setFormGallery={setFormGallery}
          onSubmit={handleUpdate}
          button={
            isEditing.value ? (
              <ButtonGroupComponent
                nameSubmit="Update"
                disableSubmit={isLoading.value}
                disableCancel={isLoading.value}
                onCancel={() => isEditing.onFalse()}
              />
            ) : null
          }
        />
      ) : (
        <Detail data={dataImages} />
      )}
    </ModalComponent>
  );
};

export default ModalDetail;
