import { useBoolean } from "@/hooks";
import { FormDaftarJemaat } from "@/types";
import { useState } from "react";
import Form from "./Form";
import { ButtonSubmitComponent, ModalComponent } from "@/components";
import { jemaatService } from "@/services";
import { customNotification, extractErrorMessage } from "@/utils";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  handleGetAll: () => void;
}

const ModalCreate = (props: PropTypes) => {
  const { isOpenModal, handleGetAll } = props;

  const isLoading = useBoolean();

  const [formDaftarJemaat, setFormDaftarJemaat] = useState<FormDaftarJemaat>({
    name: "",
    birthDate: null,
    gender: null,
    address: "",
    email: null,
    phone: null,
    status: null,
  });

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    isLoading.onTrue();
    try {
      const payload = {
        ...formDaftarJemaat,
        email:
          formDaftarJemaat.email !== "" && formDaftarJemaat.email !== null
            ? formDaftarJemaat.email
            : null,
        phone:
          formDaftarJemaat.phone !== "" && formDaftarJemaat.phone !== null
            ? formDaftarJemaat.phone
            : null,
      };

      const response = await jemaatService.create(payload);

      if (response && response.status === 201) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            handleGetAll();
            setFormDaftarJemaat({
              name: "",
              birthDate: null,
              gender: null,
              address: "",
              email: "",
              phone: "",
              status: null,
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
      title="Create New Jemaat"
      withCloseButton
      close={() => {
        isOpenModal.onFalse();
        setFormDaftarJemaat({
          name: "",
          birthDate: null,
          gender: null,
          address: "",
          email: "",
          phone: "",
          status: null,
        });
      }}>
      <Form
        isDisable={isLoading.value}
        formDaftarJemaat={formDaftarJemaat}
        setFormDaftarJemaat={setFormDaftarJemaat}
        onSubmit={handleCreate}
        button={
          <ButtonSubmitComponent name={"Save"} loading={isLoading.value} />
        }
      />
    </ModalComponent>
  );
};

export default ModalCreate;
