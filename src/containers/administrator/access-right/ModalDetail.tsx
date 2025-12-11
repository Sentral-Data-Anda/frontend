import { useBoolean } from "@/hooks";
import { FormAccess } from "@/types";
import { extractErrorMessage } from "@/utils/general";
import { customNotification } from "@/utils/notification";
import { useEffect, useState } from "react";
import Form from "./Form";
import { ButtonGroupComponent, ModalComponent } from "@/components";
import { accessService } from "@/services";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  idAccess: number;
  handleGetAll: () => void;
}

const ModalDetail = (props: PropTypes) => {
  const { isOpenModal, idAccess, handleGetAll } = props;

  const isLoading = useBoolean();

  const isLoadingDetail = useBoolean();

  const isEditing = useBoolean();

  const [formAccess, setFormAccess] = useState<FormAccess>({
    name: "",
  });

  async function handleGetDetail(idAccess: number) {
    isLoadingDetail.onTrue();

    try {
      const response = await accessService.getOne(idAccess);

      setFormAccess({ name: response.data.name });
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
      handleGetDetail(idAccess);
    }
  }, [isOpenModal]);

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    isLoading.onTrue();
    try {
      const response = await accessService.update(idAccess, formAccess);

      if (response && response.status === 200) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            handleGetAll();
            setFormAccess({
              name: "",
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
      title={`${isEditing.value ? "Edit" : "Detail"} Access Right`}
      withEditButton
      isEditing={isEditing}
      close={() => {
        isOpenModal.onFalse();
        isEditing.onFalse();
        setFormAccess({
          name: "",
        });
      }}>
      <Form
        isDisable={!isEditing.value || isLoading.value}
        formAccess={formAccess}
        setFormAccess={setFormAccess}
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
