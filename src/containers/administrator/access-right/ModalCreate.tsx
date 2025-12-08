import { useBoolean } from "@/hooks";
import { FormAccess } from "@/types";
import { customNotification } from "@/utils/notification";
import { useState } from "react";
import Form from "./Form";
import { ButtonSubmitComponent, ModalComponent } from "@/components";
import { accessService } from "@/services";
import { extractErrorMessage } from "@/utils";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  handleGetAll: () => void;
}

const ModalCreate = (props: PropTypes) => {
  const { isOpenModal, handleGetAll } = props;

  const isLoading = useBoolean();

  const [formAccess, setFormAccess] = useState<FormAccess>({
    name: "",
  });

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    isLoading.onTrue();
    try {
      const response = await accessService.create(formAccess);

      if (response && response.status === 201) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            handleGetAll();
            setFormAccess({
              name: "",
            });
            isOpenModal.onFalse();
          },
        );
      }
    } catch (error: any) {
      customNotification({
        type: typeof error === "string" ? "Warning" : "Error",
        text: extractErrorMessage(error),
      });
    } finally {
      isLoading.onFalse();
    }
  }

  return (
    <ModalComponent
      loading={isLoading.value}
      opened={isOpenModal.value}
      title="Create New Access Right"
      withCloseButton
      close={() => {
        isOpenModal.onFalse();
        setFormAccess({
          name: "",
        });
      }}>
      <Form
        isDisable={isLoading.value}
        formAccess={formAccess}
        setFormAccess={setFormAccess}
        onSubmit={handleCreate}
        button={
          <ButtonSubmitComponent name={"Save"} loading={isLoading.value} />
        }
      />
    </ModalComponent>
  );
};

export default ModalCreate;
