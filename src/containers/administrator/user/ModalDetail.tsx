import { useBoolean } from "@/hooks";
import { FormUser } from "@/types";
import { extractErrorMessage } from "@/utils/general";
import { customNotification } from "@/utils/notification";
import { useEffect, useState } from "react";
import Form from "./Form";
import {
  ButtonGroupComponent,
  ButtonSubmitComponent,
  ModalComponent,
} from "@/components";
import { userService } from "@/services";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  codeUser: string;
  handleGetAll: () => void;
}

const ModalDetail = (props: PropTypes) => {
  const { isOpenModal, codeUser, handleGetAll } = props;

  const isLoading = useBoolean();

  const isLoadingDetail = useBoolean();

  const isEditing = useBoolean();

  const [formUser, setFormUser] = useState<FormUser>({
    jemaatId: null,
    roleUserId: null,
  });

  const [nameUser, setNameUser] = useState<string>("");

  async function handleGetDetail(code: string) {
    isLoadingDetail.onTrue();

    try {
      const response = await userService.getOne(code);

      setFormUser({
        jemaatId: String(response.data.jemaat.id),
        roleUserId: String(response.data.roleUser.id),
      });

      setNameUser(response.data.jemaat.name);
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
      handleGetDetail(codeUser);
    }
  }, [isOpenModal]);

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    isLoading.onTrue();
    try {
      const response = await userService.update(codeUser, formUser);

      if (response && response.status === 200) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            handleGetAll();
            setFormUser({
              jemaatId: null,
              roleUserId: null,
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

  async function handleReset() {
    isLoading.onTrue();
    try {
      const response = await userService.reset(codeUser, formUser);

      if (response && response.status === 200) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            handleGetAll();
            setFormUser({
              jemaatId: null,
              roleUserId: null,
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
      title={`${isEditing.value ? "Edit" : "Detail"} Data User`}
      withEditButton
      isEditing={isEditing}
      close={() => {
        isOpenModal.onFalse();
        isEditing.onFalse();
        setFormUser({
          jemaatId: null,
          roleUserId: null,
        });
      }}>
      <Form
        isDisable={!isEditing.value || isLoading.value}
        formUser={formUser}
        setFormUser={setFormUser}
        onSubmit={handleUpdate}
        isEdit
        nameJemaat={nameUser}
        button={
          isEditing.value ? (
            <ButtonGroupComponent
              nameSubmit="Update"
              disableSubmit={isLoading.value}
              disableCancel={isLoading.value}
              onCancel={() => isEditing.onFalse()}
            />
          ) : (
            <ButtonSubmitComponent
              name={"Reset Account"}
              loading={isLoading.value}
              onClick={handleReset}
            />
          )
        }
      />
    </ModalComponent>
  );
};

export default ModalDetail;
