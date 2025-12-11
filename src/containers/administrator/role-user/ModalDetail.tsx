import { useBoolean } from "@/hooks";
import { Access, FormRole } from "@/types";
import { extractErrorMessage } from "@/utils/general";
import { customNotification } from "@/utils/notification";
import { useEffect, useState } from "react";
import Form from "./Form";
import { ButtonGroupComponent, ModalComponent } from "@/components";
import { roleService } from "@/services";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  idRole: number;
  handleGetAll: () => void;
}

const ModalDetail = (props: PropTypes) => {
  const { isOpenModal, idRole, handleGetAll } = props;

  const isLoading = useBoolean();

  const isLoadingDetail = useBoolean();

  const isEditing = useBoolean();

  const [formRole, setFormRole] = useState<FormRole>({
    name: "",
    isAdmin: false,
    accessRights: [],
  });

  async function handleGetDetail(idRole: number) {
    isLoadingDetail.onTrue();

    try {
      const response = await roleService.getOne(idRole);

      const idAccess = response.data.access.map((item: Access) => item.id);

      setFormRole({
        name: response.data.name,
        isAdmin: response.data.isAdmin,
        accessRights: idAccess,
      });
    } catch (error: any) {
      customNotification({
        type: typeof error === "string" ? "Warning" : "Error",
        text: error || "Something went wrong",
      });
    } finally {
      isLoadingDetail.onFalse();
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
      const response = await roleService.update(idRole, formRole);

      if (response && response.status === 200) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            handleGetAll();
            setFormRole({
              name: "",
              isAdmin: false,
              accessRights: [],
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
      title={`${isEditing.value ? "Edit" : "Detail"} Role User`}
      withEditButton
      isEditing={isEditing}
      close={() => {
        isOpenModal.onFalse();
        isEditing.onFalse();
        setFormRole({
          name: "",
          isAdmin: false,
          accessRights: [],
        });
      }}>
      <Form
        isOpenModal={isOpenModal.value}
        isDisable={!isEditing.value || isLoading.value}
        formRole={formRole}
        setFormRole={setFormRole}
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
