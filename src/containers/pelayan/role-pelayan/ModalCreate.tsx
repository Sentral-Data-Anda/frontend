import { useBoolean } from "@/hooks";
import { FormRolePelayan } from "@/types";
import { extractErrorMessage } from "@/utils/general";
import { customNotification } from "@/utils/notification";
import { useState } from "react";
import Form from "./Form";
import { ButtonSubmitComponent, ModalComponent } from "@/components";
import { rolePelayanService } from "@/services";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  handleGetAll: () => void;
}

const ModalCreate = (props: PropTypes) => {
  const { isOpenModal, handleGetAll } = props;

  const isLoading = useBoolean();

  const [formRolePelayan, setFormRolePelayan] = useState<FormRolePelayan>({
    name: "",
  });

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    isLoading.onTrue();
    try {
      const response = await rolePelayanService.create(formRolePelayan);

      if (response && response.status === 201) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            handleGetAll();
            setFormRolePelayan({
              name: "",
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
      loading={isLoading.value}
      opened={isOpenModal.value}
      title="Create Role Pelayan"
      withCloseButton
      close={() => {
        isOpenModal.onFalse();
        setFormRolePelayan({
          name: "",
        });
      }}>
      <Form
        isDisable={isLoading.value}
        formRolePelayan={formRolePelayan}
        setFormRolePelayan={setFormRolePelayan}
        onSubmit={handleCreate}
        button={
          <ButtonSubmitComponent name={"Save"} loading={isLoading.value} />
        }
      />
    </ModalComponent>
  );
};

export default ModalCreate;
