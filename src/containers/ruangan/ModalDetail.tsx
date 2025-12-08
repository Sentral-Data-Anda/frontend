import { useBoolean } from "@/hooks";
import { FormRuangan, ImageRuangan, Ruangan } from "@/types";
import { useEffect, useState } from "react";
import Form from "./Form";
import { ButtonGroupComponent, ModalComponent } from "@/components";
import { ruanganService } from "@/services";
import {
  customNotification,
  extractErrorMessage,
  urlImageToFile,
} from "@/utils";
import Detail from "./Detail";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  codeRuang: string;
  handleGetAll: () => void;
}

const ModalDetail = (props: PropTypes) => {
  const { isOpenModal, codeRuang, handleGetAll } = props;

  const isLoading = useBoolean();

  const isLoadingDetail = useBoolean();

  const isEditing = useBoolean();

  const [dataImages, setDataImages] = useState<string[]>([]);

  const [detailRuangan, setDetailRuangan] = useState<Ruangan | null>(null);

  const [formRuangan, setFormRuangan] = useState<FormRuangan>({
    name: "",
    capacity: "",
    mainImage: undefined,
    image: [undefined],
  });

  async function handleGetDetail(codeRuang: string) {
    isLoadingDetail.onTrue();

    try {
      const response = await ruanganService.getOne(codeRuang);

      const listImage = [];

      listImage.push(response.data.mainImage.path);

      response.data.detailImage?.map((item: any) => {
        listImage.push(item.path);
      });

      setFormRuangan({
        ...formRuangan,
        name: response.data.name,
        capacity: response.data.capacity,
      });

      setDataImages(listImage);

      setDetailRuangan(response.data);
    } catch (error: any) {
      customNotification({
        type: typeof error === "string" ? "Warning" : "Error",
        text: extractErrorMessage(error),
      });
    } finally {
      isLoadingDetail.onFalse();
    }
  }

  useEffect(() => {
    if (isOpenModal.value) {
      handleGetDetail(codeRuang);
    }
  }, [isOpenModal]);

  const loadForm = async () => {
    if (detailRuangan) {
      let basicImage: File | null = null;
      let detailImage: File[] = [];

      if (detailRuangan.detailImage && detailRuangan.detailImage.length > 0) {
        detailImage = await Promise.all(
          detailRuangan.detailImage.map((item: ImageRuangan) =>
            urlImageToFile(item.path, item.originalName, item.mimeType),
          ),
        );
      }

      if (detailRuangan.mainImage) {
        basicImage = await urlImageToFile(
          detailRuangan.mainImage.path,
          detailRuangan.mainImage.originalName,
          detailRuangan.mainImage.mimeType,
        );
      }

      setFormRuangan({
        ...formRuangan,
        mainImage: basicImage,
        image: detailImage,
      });
    }
  };

  useEffect(() => {
    if (isEditing.value) {
      loadForm();
    }
  }, [isEditing.value]);

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    isLoading.onTrue();
    try {
      const payload = new FormData();

      payload.append("name", formRuangan.name);
      payload.append("capacity", String(formRuangan.capacity));

      if (formRuangan.mainImage) {
        payload.append("mainImage", formRuangan.mainImage);
      }

      if (formRuangan.image) {
        formRuangan.image
          ?.filter((file): file is File => file !== undefined && file !== null)
          .forEach((file) => payload.append("image", file));
      }

      const response = await ruanganService.update(codeRuang, payload);

      if (response && response.status === 200) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            handleGetAll();
            setFormRuangan({
              name: "",
              capacity: "",
              mainImage: undefined,
              image: [],
            });
            isOpenModal.onFalse();
            isEditing.onFalse();
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
      title={`${isEditing.value ? "Edit" : "Detail"} Ruangan`}
      withEditButton
      isEditing={isEditing}
      close={() => {
        isOpenModal.onFalse();
        isEditing.onFalse();
        setFormRuangan({
          name: "",
          capacity: "",
          mainImage: undefined,
          image: [],
        });
        setDetailRuangan(null);
      }}>
      {isEditing.value ? (
        <Form
          isDisable={!isEditing.value || isLoading.value}
          formRuangan={formRuangan}
          setFormRuangan={setFormRuangan}
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
