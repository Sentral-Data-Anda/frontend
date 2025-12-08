import { useBoolean } from "@/hooks";
import { FormRuangan } from "@/types";
import { useState } from "react";
import Form from "./Form";
import { ButtonSubmitComponent, ModalComponent } from "@/components";
import { ruanganService } from "@/services";
import { customNotification, extractErrorMessage } from "@/utils";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  handleGetAll: () => void;
}

const ModalCreate = (props: PropTypes) => {
  const { isOpenModal, handleGetAll } = props;

  const isLoading = useBoolean();

  const [formRuangan, setFormRuangan] = useState<FormRuangan>({
    name: "",
    capacity: "",
    mainImage: undefined,
    image: [undefined],
  });

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
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

      const response = await ruanganService.create(payload);

      if (response && response.status === 201) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            handleGetAll();
            setFormRuangan({
              name: "",
              capacity: "",
              mainImage: undefined,
              image: [undefined],
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
      title="Create New Ruangan"
      withCloseButton
      close={() => {
        isOpenModal.onFalse();
        setFormRuangan({
          name: "",
          capacity: "",
          mainImage: undefined,
          image: [undefined],
        });
      }}>
      <Form
        isDisable={isLoading.value}
        formRuangan={formRuangan}
        setFormRuangan={setFormRuangan}
        onSubmit={handleCreate}
        button={
          <ButtonSubmitComponent name={"Save"} loading={isLoading.value} />
        }
      />
    </ModalComponent>
  );
};

export default ModalCreate;
