import { useBoolean } from "@/hooks";
import { FormTemplate } from "@/types";
import { extractErrorMessage } from "@/utils/general";
import { customNotification } from "@/utils/notification";
import { useEffect, useState } from "react";
import Form from "./Form";
import { ButtonGroupComponent, ModalComponent } from "@/components";
import { templatePelayanService } from "@/services";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  codeTemplate: string;
  handleGetAll: () => void;
}

const ModalDetail = (props: PropTypes) => {
  const { isOpenModal, codeTemplate, handleGetAll } = props;

  const isLoading = useBoolean();

  const isLoadingDetail = useBoolean();

  const isEditing = useBoolean();

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

  async function handleGetDetail(codeTemplate: string) {
    isLoadingDetail.onTrue();

    try {
      const response = await templatePelayanService.getOne(codeTemplate);

      setFormTemplate({
        bapelId: response.data.bapel ? String(response.data.bapel.id) : null,
        name: response.data.name,
        startTime: response.data.startTime,
        endTime: response.data.endTime,
        detail: response.data.detail.map((item: any) => {
          return {
            order: item.order,
            rolePelayanId: String(item.rolePelayanId),
          };
        }),
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
      handleGetDetail(codeTemplate);
    }
  }, [isOpenModal]);

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    isLoading.onTrue();
    try {
      const response = await templatePelayanService.update(
        codeTemplate,
        formTemplate,
      );

      if (response && response.status === 200) {
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
      title={`${isEditing.value ? "Edit" : "Detail"} Template`}
      withEditButton
      isEditing={isEditing}
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
        isDisable={!isEditing.value || isLoading.value}
        formTemplate={formTemplate}
        setFormTemplate={setFormTemplate}
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
    </ModalComponent>
  );
};

export default ModalDetail;
