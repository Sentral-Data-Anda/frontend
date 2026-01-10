import { useBoolean } from "@/hooks";
import { FormTemplate } from "@/types";
import { extractErrorMessage } from "@/utils/general";
import { customNotification } from "@/utils/notification";
import { useState } from "react";
import Form from "./Form";
import { ButtonSubmitComponent, ModalComponent } from "@/components";
import { templatePelayanService } from "@/services";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  handleGetAll: () => void;
}

const ModalCreate = (props: PropTypes) => {
  const { isOpenModal, handleGetAll } = props;

  const isLoading = useBoolean();

  const [formTemplate, setFormTemplate] = useState<FormTemplate>({
    bapelId: null,
    name: "",
    startTime: null,
    endTime: null,
    detail: [
      {
        order: 1,
        rolePelayanId: null,
      },
    ],
  });

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    isLoading.onTrue();
    try {
      const response = await templatePelayanService.create(formTemplate);

      if (response && response.status === 201) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            handleGetAll();
            setFormTemplate({
              bapelId: null,
              name: "",
              startTime: null,
              endTime: null,
              detail: [
                {
                  order: 1,
                  rolePelayanId: null,
                },
              ],
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
      title="Create Template"
      withCloseButton
      close={() => {
        isOpenModal.onFalse();
        setFormTemplate({
          bapelId: null,
          name: "",
          startTime: null,
          endTime: null,
          detail: [
            {
              order: 1,
              rolePelayanId: null,
            },
          ],
        });
      }}>
      <Form
        isDisable={isLoading.value}
        formTemplate={formTemplate}
        setFormTemplate={setFormTemplate}
        onSubmit={handleCreate}
        button={
          <ButtonSubmitComponent name={"Save"} loading={isLoading.value} />
        }
      />
    </ModalComponent>
  );
};

export default ModalCreate;
