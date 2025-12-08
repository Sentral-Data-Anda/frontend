import { useBoolean } from "@/hooks";
import { FormBarang } from "@/types";
import { useState } from "react";
import Form from "./Form";
import { ButtonSubmitComponent, ModalComponent } from "@/components";
import { barangService } from "@/services";
import { customNotification, extractErrorMessage } from "@/utils";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  handleGetAll: () => void;
}

const ModalCreate = (props: PropTypes) => {
  const { isOpenModal, handleGetAll } = props;

  const isLoading = useBoolean();

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
    image: [undefined],
    typeId: null,
    bapelId: null,
    roomId: null,
  });

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
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

      const response = await barangService.create(payload);

      if (response && response.status === 201) {
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
              maintenancePeriod: "",
              mainImage: undefined,
              image: [],
              typeId: null,
              bapelId: null,
              roomId: null,
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
      }).then(() => isLoading.onFalse());
    }
  }

  return (
    <ModalComponent
      opened={isOpenModal.value}
      title="Create New Barang"
      withCloseButton
      close={() => {
        isOpenModal.onFalse();
        setFormBarang({
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
      }}>
      <Form
        isDisable={isLoading.value}
        formBarang={formBarang}
        setFormBarang={setFormBarang}
        onSubmit={handleCreate}
        button={
          <ButtonSubmitComponent name={"Save"} loading={isLoading.value} />
        }
      />
    </ModalComponent>
  );
};

export default ModalCreate;
