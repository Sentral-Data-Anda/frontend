import { useBoolean } from "@/hooks";
import { Barang, FormBarang, ImageBarang } from "@/types";
import { useEffect, useState } from "react";
import Form from "./Form";
import { ButtonGroupComponent, ModalComponent } from "@/components";
import { barangService } from "@/services";
import {
  customNotification,
  extractErrorMessage,
  urlImageToFile,
} from "@/utils";
import Detail from "./Detail";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  codeBarang: string;
  handleGetAll: () => void;
  withEditButton: boolean;
}

const ModalDetail = (props: PropTypes) => {
  const { isOpenModal, codeBarang, handleGetAll, withEditButton } = props;

  const isLoading = useBoolean();

  const isLoadingDetail = useBoolean();

  const isEditing = useBoolean();

  const [data, setData] = useState<Barang | null>(null);

  const [formBarang, setFormBarang] = useState<FormBarang>({
    name: "",
    description: "",
    purchaseDate: null,
    purchasePrice: "",
    guaranty: "",
    quantity: "",
    maintainceDate: null,
    maintainceInterval: undefined,
    maintenancePeriod: "",
    mainImage: undefined,
    image: [],
    typeId: null,
    bapelId: null,
    roomId: null,
  });

  async function handleGetDetail(codeBarang: string) {
    isLoadingDetail.onTrue();

    try {
      const response = await barangService.getOne(codeBarang);

      setData(response.data);

      let basicImage: File = {} as File;

      let detailImage: File[] = [];

      if (response.data.detailImage) {
        const detailImageArray = response.data.detailImage;

        detailImage = await Promise.all(
          detailImageArray.map((item: ImageBarang) =>
            urlImageToFile(item.path, item.originalName, item.mimeType),
          ),
        );
      }

      if (response.data.mainImage) {
        basicImage = await urlImageToFile(
          response.data.mainImage.path,
          response.data.mainImage.originalName,
          response.data.mainImage.mimeType,
        );
      }

      setFormBarang({
        name: response.data.name,
        description: response.data.description,
        purchaseDate: response.data.purchaseDate
          ? response.data.purchaseDate
          : null,
        purchasePrice: response.data.purchasePrice,
        guaranty: response.data.guaranty,
        quantity: response.data.quantity,
        maintainceDate: response.data.maintainceDate,
        maintainceInterval: response.data.maintainceInterval ?? null,
        maintenancePeriod: response.data.maintenancePeriod ?? null,
        mainImage: basicImage,
        image: detailImage,
        typeId: String(response.data.type.id),
        bapelId: String(response.data.bapel.id),
        roomId: String(response.data.room.id),
      });
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
      handleGetDetail(codeBarang);
    }
  }, [isOpenModal]);

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    isLoading.onTrue();
    try {
      const payload = new FormData();

      payload.append("name", formBarang.name);
      payload.append("description", formBarang.description);
      payload.append("quantity", String(formBarang.quantity));
      payload.append("typeId", String(formBarang.typeId));
      payload.append("bapelId", String(formBarang.bapelId));
      payload.append("roomId", String(formBarang.roomId));
      payload.append(
        "maintainceInterval",
        String(formBarang.maintainceInterval),
      );

      if (formBarang.maintenancePeriod) {
        payload.append("maintenancePeriod", formBarang.maintenancePeriod);
      }

      if (formBarang.guaranty) {
        payload.append("guaranty", String(formBarang.guaranty));
      }

      if (formBarang.purchasePrice) {
        payload.append("purchasePrice", String(formBarang.purchasePrice));
      }

      if (formBarang.purchaseDate) {
        payload.append("purchaseDate", String(formBarang.purchaseDate));
      }

      if (formBarang.maintainceDate) {
        payload.append("maintainceDate", String(formBarang.maintainceDate));
      }

      if (formBarang.mainImage) {
        payload.append("mainImage", formBarang.mainImage);
      }

      if (formBarang.image) {
        formBarang.image
          ?.filter((file): file is File => file !== undefined && file !== null)
          .forEach((file) => payload.append("image", file));
      }

      const response = await barangService.update(codeBarang, payload);

      if (response && response.status === 200) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            handleGetAll();
            setFormBarang({
              name: "",
              description: "",
              purchaseDate: null,
              purchasePrice: "",
              guaranty: "",
              quantity: "",
              maintainceDate: null,
              maintainceInterval: undefined,
              maintenancePeriod: null,
              mainImage: undefined,
              image: [],
              typeId: null,
              bapelId: null,
              roomId: null,
            });
            isOpenModal.onFalse();
            isLoading.onFalse();
            setData(null);
          },
        );
      }
    } catch (error: any) {
      customNotification({
        type: typeof error === "string" ? "Warning" : "Error",
        text: extractErrorMessage(error),
      }).then(() => isLoading.onFalse());
    }
  }

  return (
    <ModalComponent
      loading={isLoadingDetail.value}
      opened={isOpenModal.value}
      title={`${isEditing.value ? "Edit" : "Detail"} Barang`}
      withEditButton={withEditButton}
      isEditing={isEditing}
      close={() => {
        isOpenModal.onFalse();
        isEditing.onFalse();
        setData(null);
        setFormBarang({
          name: "",
          description: "",
          purchaseDate: null,
          purchasePrice: "",
          guaranty: "",
          quantity: "",
          maintainceDate: null,
          maintainceInterval: undefined,
          maintenancePeriod: null,
          mainImage: undefined,
          image: [],
          typeId: null,
          bapelId: null,
          roomId: null,
        });
      }}>
      {isEditing.value ? (
        <Form
          isDisable={!isEditing.value || isLoading.value}
          formBarang={formBarang}
          setFormBarang={setFormBarang}
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
        <Detail data={data} />
      )}
    </ModalComponent>
  );
};

export default ModalDetail;
