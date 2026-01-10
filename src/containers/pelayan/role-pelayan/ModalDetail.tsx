import { useBoolean } from "@/hooks";
import { FormRolePelayan } from "@/types";
import { extractErrorMessage } from "@/utils/general";
import { customNotification } from "@/utils/notification";
import { useEffect, useState } from "react";
import Form from "./Form";
import { ButtonGroupComponent, ModalComponent } from "@/components";
import { rolePelayanService } from "@/services";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  idRole: number;
  handleGetAll: () => void;
  withEditButton: boolean;
}

const ModalDetail = (props: PropTypes) => {
  const { isOpenModal, idRole, handleGetAll, withEditButton } = props;

  const isLoading = useBoolean();

  const isEditing = useBoolean();

  const [formRolePelayan, setFormRolePelayan] = useState<FormRolePelayan>({
    name: "",
  });

  async function handleGetDetail(idRole: number) {
    isLoading.onTrue();

    try {
      const response = await rolePelayanService.getOne(idRole);

      setFormRolePelayan({
        name: response.data.name,
      });
    } catch (error: any) {
      customNotification({
        type: typeof error === "string" ? "Warning" : "Error",
        text: error || "Something went wrong",
      });
    } finally {
      isLoading.onFalse();
    }
  }

  useEffect(() => {
    if (isOpenModal.value) {
      handleGetDetail(idRole);
    }
  }, [isOpenModal]);

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    isLoading.onTrue();
    try {
      const response = await rolePelayanService.update(idRole, formRolePelayan);

      if (response && response.status === 200) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            handleGetAll();
            setFormRolePelayan({
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
      loading={isLoading.value}
      opened={isOpenModal.value}
      title={`${isEditing.value ? "Edit" : "Detail"} Role Pelayan`}
      withEditButton={withEditButton}
      isEditing={isEditing}
      close={() => {
        isOpenModal.onFalse();
        isEditing.onFalse();
        setFormRolePelayan({
          name: "",
        });
      }}>
      <Form
        isDisable={!isEditing.value || isLoading.value}
        formRolePelayan={formRolePelayan}
        setFormRolePelayan={setFormRolePelayan}
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
