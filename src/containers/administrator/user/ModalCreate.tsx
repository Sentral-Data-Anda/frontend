import { useBoolean } from "@/hooks";
import { FormUser, NewUser } from "@/types";
import { extractErrorMessage } from "@/utils/general";
import { customNotification } from "@/utils/notification";
import { useState } from "react";
import Form from "./Form";
import { ButtonSubmitComponent, ModalComponent } from "@/components";
import { userService } from "@/services";

interface PropTypes {
  isOpenModal: ReturnType<typeof useBoolean>;
  handleGetAll: () => void;
  isOpenModalNewUser: ReturnType<typeof useBoolean>;
  handleNewUser: (_value: NewUser | null) => void;
}

const ModalCreate = (props: PropTypes) => {
  const { isOpenModal, handleGetAll, isOpenModalNewUser, handleNewUser } =
    props;

  const isLoading = useBoolean();

  const [formUser, setFormUser] = useState<FormUser>({
    jemaatId: null,
    roleUserId: null,
  });

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    isLoading.onTrue();
    try {
      const response = await userService.create(formUser);

      if (response && response.status === 201) {
        customNotification({ type: "Success", text: response.message }).then(
          () => {
            handleGetAll();
            handleNewUser({
              name: response.data.name,
              username: response.data.username,
              password: response.data.password,
            });
            setFormUser({
              jemaatId: null,
              roleUserId: null,
            });
            isOpenModal.onFalse();
            isLoading.onFalse();
            isOpenModalNewUser.onTrue();
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
      title="Create New User"
      withCloseButton
      close={() => {
        isOpenModal.onFalse();
        setFormUser({
          jemaatId: null,
          roleUserId: null,
        });
      }}>
      <Form
        isDisable={isLoading.value}
        formUser={formUser}
        setFormUser={setFormUser}
        onSubmit={handleCreate}
        button={
          <ButtonSubmitComponent name={"Save"} loading={isLoading.value} />
        }
      />
    </ModalComponent>
  );
};

export default ModalCreate;
